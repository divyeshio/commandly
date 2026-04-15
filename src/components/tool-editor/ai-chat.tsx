import { ApiKeySettings } from "./api-key-settings";
import {
  ModelPicker,
  ReasoningEffortPicker,
  getProviderOptions,
  providerForModel,
  MODEL_GROUPS,
  type ReasoningEffort,
} from "./model-picker";
import { generatePrompt } from "./prompt";
import { useToolBuilder } from "./tool-editor.context";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import {
  Context,
  ContextCacheUsage,
  ContextContent,
  ContextContentBody,
  ContextContentFooter,
  ContextContentHeader,
  ContextInputUsage,
  ContextOutputUsage,
  ContextReasoningUsage,
  ContextTrigger,
} from "@/components/ai-elements/context";
import {
  Tool as ToolCard,
  ToolContent,
  ToolHeader,
} from "@/components/ai-elements/tool";
import { Tool } from "@/components/commandly/types/flat";
import { exportToStructuredJSON } from "@/components/commandly/utils/flat";
import {
  createApplyToolDefinitionTool,
  createEditTool,
  createReadTool,
  createTavilyExtractTool,
  createTavilySearchTool
} from "./tools";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAIKeys, type AIProvider } from "@/lib/ai-keys";
import { cn, replaceKey } from "@/lib/utils";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createMistral } from "@ai-sdk/mistral";
import { createOpenAI } from "@ai-sdk/openai";
import { createXai } from "@ai-sdk/xai";
import { hasToolCall, stepCountIs, streamText, type LanguageModelUsage, type ModelMessage } from "ai";
import {
  CheckIcon,
  CopyIcon,
  FlagIcon,
  HashIcon,
  LinkIcon,
  PencilIcon,
  RefreshCcwIcon,
  SearchIcon,
  SparklesIcon,
  SquarePenIcon,
  TerminalIcon,
  XIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface ToolCallEntry {
  toolCallId: string;
  toolName: string;
  title: string;
  input: Record<string, unknown>;
  state: "input-available" | "approval-requested" | "output-available" | "output-error";
  output?: unknown;
  errorText?: string;
  originalTool?: Tool;
  previewTool?: Tool;
}

interface ChatSession {
  id: string;
  toolName: string;
  messages: ChatMessage[];
  updatedAt: number;
  preview: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  toolApplied?: boolean;
  toolCalls?: ToolCallEntry[];
  isEditing?: boolean;
  editingContent?: string;
  reasoningContent?: string;
}

const PROMPT_PILLS = [
  {
    label: "Sorting & Grouping",
    text: "Sort all parameters, grouping similar ones together (e.g., output options, filter options, connection options). Update parameter names and descriptions to be consistent within each group. Anything related to verbose, debug, or logging should be at the end",
  },
  {
    label: "Update from docs",
    text: "Update this tool's description, parameter descriptions, and types to accurately reflect the official documentation. Make descriptions concise and in sentence case.",
  },
  {
    label: "Fix types & validation",
    text: "Fix parameter types (string, number, boolean, array), mark required parameters correctly, and add appropriate validation rules where needed.",
  },
];

const MODEL_MAX_TOKENS: Record<string, number> = {
  "claude-opus-4-5": 200000,
  "claude-sonnet-4-5": 200000,
  "claude-haiku-3-5": 200000,
  "gpt-4o": 128000,
  "gpt-4o-mini": 128000,
  "o1": 200000,
  "o3": 200000,
  "o4-mini": 200000,
  "gemini-2.0-flash": 1048576,
  "gemini-2.5-pro": 1048576,
  "grok-3": 131072,
  "llama-3.3-70b-versatile": 128000,
};
const DEFAULT_MAX_TOKENS = 128_000;

function openSessionsDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("commandly", 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("keys")) {
        db.createObjectStore("keys");
      }
      if (!db.objectStoreNames.contains("sessions")) {
        const store = db.createObjectStore("sessions", { keyPath: "id" });
        store.createIndex("toolName", "toolName", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveChatSession(session: ChatSession): Promise<void> {
  const db = await openSessionsDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("sessions", "readwrite");
    tx.objectStore("sessions").put(session);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadRecentSessions(toolName: string, limit = 5): Promise<ChatSession[]> {
  const db = await openSessionsDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("sessions", "readonly");
    const index = tx.objectStore("sessions").index("toolName");
    const req = index.getAll(toolName);
    req.onsuccess = () => {
      const all = (req.result as ChatSession[]).sort((a, b) => b.updatedAt - a.updatedAt);
      resolve(all.slice(0, limit));
    };
    req.onerror = () => reject(req.error);
  });
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function computeLineDiff(
  a: string,
  b: string,
): Array<{ type: "same" | "add" | "remove"; text: string }> {
  const aLines = a.split("\n");
  const bLines = b.split("\n");
  const m = aLines.length;
  const n = bLines.length;
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        aLines[i - 1] === bLines[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const result: Array<{ type: "same" | "add" | "remove"; text: string }> = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && aLines[i - 1] === bLines[j - 1]) {
      result.unshift({ type: "same", text: aLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: "add", text: bLines[j - 1] });
      j--;
    } else {
      result.unshift({ type: "remove", text: aLines[i - 1] });
      i--;
    }
  }
  return result;
}


function createModelInstance(provider: AIProvider, key: string, model: string) {
  switch (provider) {
    case "anthropic":
      return createAnthropic({ apiKey: key })(model);
    case "google":
      return createGoogleGenerativeAI({ apiKey: key })(model);
    case "groq":
      return createGroq({ apiKey: key })(model);
    case "mistral":
      return createMistral({ apiKey: key })(model);
    case "xai":
      return createXai({ apiKey: key })(model);
    default:
      return createOpenAI({ apiKey: key })(model);
  }
}

function useAIChat(
  currentTool: Tool,
  onApply: (tool: Tool) => void,
  onStreamingTool?: (tool: Tool | null) => void,
  onGeneratingChange?: (isGenerating: boolean) => void,
) {
  const { contextSelection } = useToolBuilder();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [modelInternal, setModelInternal] = useState(
    () => localStorage.getItem("ai-model") ?? MODEL_GROUPS[0].models[0].value,
  );
  const [reasoningEffort, setReasoningEffortState] = useState<ReasoningEffort | null>(
    () => (localStorage.getItem("ai-reasoning-effort") as ReasoningEffort | null),
  );
  const schemaRef = useRef<object | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [pendingApproval, setPendingApproval] = useState<{
    approvalId: string;
    toolCallId: string;
    continuationMessages: ModelMessage[];
    previewTool: Tool;
    originalTool: Tool;
    summary: string;
    messageIndex: number;
  } | null>(null);
  const [usage, setUsage] = useState<LanguageModelUsage | null>(null);
  const [toolCallCount, setToolCallCount] = useState(0);
  const [recentSessions, setRecentSessions] = useState<ChatSession[]>([]);
  const sessionIdRef = useRef(crypto.randomUUID());

  useEffect(() => {
    loadRecentSessions(currentTool.name).then(setRecentSessions).catch(() => { });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTool.name]);

  const model = modelInternal;
  const setModel = useCallback((m: string) => {
    setModelInternal(m);
    localStorage.setItem("ai-model", m);
    const isReasoning = MODEL_GROUPS.flatMap((g) => g.models).find((mo) => mo.value === m)?.reasoning === true;
    if (!isReasoning) {
      setReasoningEffortState(null);
      localStorage.removeItem("ai-reasoning-effort");
    }
  }, []);

  const setReasoningEffort = useCallback((effort: ReasoningEffort | null) => {
    setReasoningEffortState(effort);
    if (effort === null) {
      localStorage.removeItem("ai-reasoning-effort");
    } else {
      localStorage.setItem("ai-reasoning-effort", effort);
    }
  }, []);

  const provider = providerForModel(model);
  const openAIKeys = useAIKeys("openai");
  const anthropicKeys = useAIKeys("anthropic");
  const googleKeys = useAIKeys("google");
  const groqKeys = useAIKeys("groq");
  const mistralKeys = useAIKeys("mistral");
  const xaiKeys = useAIKeys("xai");
  const tavilyKeys = useAIKeys("tavily");

  const allProviderKeys = {
    openai: openAIKeys,
    anthropic: anthropicKeys,
    google: googleKeys,
    groq: groqKeys,
    mistral: mistralKeys,
    xai: xaiKeys,
  };
  const currentKeys = allProviderKeys[provider as Exclude<AIProvider, "tavily">];

  useEffect(() => {
    fetch("/specification/flat.json")
      .then((r) => r.json())
      .then((s) => {
        schemaRef.current = s;
      })
      .catch(() => { });
  }, []);

  const runStream = useCallback(
    async (userText: string, history: ChatMessage[]) => {
      abortControllerRef.current = new AbortController();
      const toolSnapshot = currentTool;
      let isToolApplied = false;
      let pendingPreview: Tool | null = null;
      let waitingForApproval = false;

      try {
        const schema = schemaRef.current ? JSON.stringify(schemaRef.current, null, 2) : "{}";
        const contextCommands = currentTool.commands.filter((c) =>
          contextSelection.commandKeys.includes(c.key),
        );
        const contextParameters = currentTool.parameters.filter((p) =>
          contextSelection.parameterKeys.includes(p.key),
        );
        const systemPrompt = generatePrompt(schema, {
          context: {
            selectedCommands: contextCommands.map((c) => ({ key: c.key, name: c.name })),
            selectedParameters: contextParameters.map((p) => ({
              key: p.key,
              name: p.name,
              longFlag: p.longFlag,
              shortFlag: p.shortFlag,
            })),
          },
        });
        const aiModel = createModelInstance(provider, currentKeys.key, model);
        const userMessage: ChatMessage = { role: "user", content: userText };
        const assistantMessageIndex = history.length + 1;
        const priorModelMessages: ModelMessage[] = [...history, userMessage].map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

        const editToolDef = createEditTool(
          () => pendingPreview ?? toolSnapshot,
          (t) => { pendingPreview = t; onStreamingTool?.(t); }
        );

        const applyToolDefinitionDef = createApplyToolDefinitionTool(
          () => { isToolApplied = true; },
          () => {
            if (pendingPreview) {
              onApply(replaceKey(pendingPreview) as Tool);
              pendingPreview = null;
            }
            onStreamingTool?.(null);
          }
        );

        const readToolDef = createReadTool(() => pendingPreview ?? toolSnapshot);

        const tavilySearchTool = tavilyKeys.isSaved && tavilyKeys.key
          ? createTavilySearchTool(tavilyKeys.key)
          : undefined;
        const tavilyExtractTool = tavilyKeys.isSaved && tavilyKeys.key
          ? createTavilyExtractTool(tavilyKeys.key)
          : undefined;

        const { fullStream } = streamText({
          model: aiModel,
          system: systemPrompt,
          messages: priorModelMessages,
          tools: {
            editTool: editToolDef,
            applyToolDefinition: applyToolDefinitionDef,
            readTool: readToolDef,
            ...(tavilySearchTool ? { tavilySearch: tavilySearchTool } : {}),
            ...(tavilyExtractTool ? { tavilyExtract: tavilyExtractTool } : {}),
          },
          stopWhen: [
            stepCountIs(20), // Maximum 20 steps
            hasToolCall('applyToolDefinition'), // Stop after calling 'applyToolDefinition'
          ],
          abortSignal: abortControllerRef.current.signal,
          onFinish: ({ usage: u }) => setUsage(u),
          providerOptions: (reasoningEffort && MODEL_GROUPS.flatMap((g) => g.models).find((m) => m.value === model)?.reasoning === true
            ? getProviderOptions(provider, model, reasoningEffort)
            : undefined) as Record<string, Record<string, string | number | boolean | null | Record<string, string | number | boolean | null>>> | undefined,
        });

        let fullText = "";
        let applyToolCallId: string | null = null;
        let reasoningBuffer = "";
        const continuationHistory: ModelMessage[] = [...priorModelMessages];
        let currentStepText = "";
        const currentStepCalls: Array<{ toolCallId: string; toolName: string; input: Record<string, unknown> }> = [];
        const resolvedResults = new Map<string, unknown>();
        const flushCompletedStep = () => {
          const assistantContent = [
            ...(currentStepText ? [{ type: "text" as const, text: currentStepText }] : []),
            ...currentStepCalls.map((c) => ({ type: "tool-call" as const, toolCallId: c.toolCallId, toolName: c.toolName, input: c.input })),
          ];
          if (assistantContent.length > 0) {
            continuationHistory.push({ role: "assistant", content: assistantContent } as ModelMessage);
          }
          if (currentStepCalls.length > 0) {
            continuationHistory.push({
              role: "tool",
              content: currentStepCalls.map((c) => ({
                type: "tool-result" as const,
                toolCallId: c.toolCallId,
                toolName: c.toolName,
                output: resolvedResults.get(c.toolCallId),
              })),
            } as ModelMessage);
          }
          currentStepText = "";
          currentStepCalls.length = 0;
          resolvedResults.clear();
        };

        for await (const part of fullStream) {
          if (part.type === "text-delta") {
            fullText += part.text;
            currentStepText += part.text;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: "assistant",
                content: fullText,
                toolCalls: updated[updated.length - 1].toolCalls,
                toolApplied: updated[updated.length - 1].toolApplied,
                reasoningContent: updated[updated.length - 1].reasoningContent,
              };
              return updated;
            });
          } else if (part.type === "reasoning-delta") {
            reasoningBuffer += part.text;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                reasoningContent: reasoningBuffer,
              };
              return updated;
            });
          } else if (part.type === "tool-input-start" && part.toolName === "editTool") {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              const entry: ToolCallEntry = {
                toolCallId: part.id,
                toolName: "editTool",
                title: "Editing…",
                input: {},
                state: "input-available",
              };
              updated[updated.length - 1] = {
                ...last,
                toolCalls: [...(last.toolCalls ?? []), entry],
              };
              return updated;
            });
          } else if (part.type === "tool-input-start" && part.toolName === "readTool") {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              const entry: ToolCallEntry = {
                toolCallId: part.id,
                toolName: "readTool",
                title: "Reading tool JSON…",
                input: {},
                state: "input-available",
              };
              updated[updated.length - 1] = {
                ...last,
                toolCalls: [...(last.toolCalls ?? []), entry],
              };
              return updated;
            });
          } else if (part.type === "tool-input-start" && part.toolName === "applyToolDefinition") {
            applyToolCallId = part.id;
            onGeneratingChange?.(true);
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              const entry: ToolCallEntry = {
                toolCallId: part.id,
                toolName: "applyToolDefinition",
                title: "Preparing to apply",
                input: {},
                state: "input-available",
              };
              updated[updated.length - 1] = {
                ...last,
                toolCalls: [...(last.toolCalls ?? []), entry],
              };
              return updated;
            });
          } else if (
            part.type === "tool-input-start" &&
            (part.toolName === "tavilySearch" || part.toolName === "tavilyExtract")
          ) {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              const entry: ToolCallEntry = {
                toolCallId: part.id,
                toolName: part.toolName,
                title: part.toolName === "tavilySearch" ? "Web Search" : "Extract Content",
                input: {},
                state: "input-available",
              };
              updated[updated.length - 1] = {
                ...last,
                toolCalls: [...(last.toolCalls ?? []), entry],
              };
              return updated;
            });
          } else if (part.type === "tool-call" && part.toolName !== "applyToolDefinition") {
            currentStepCalls.push({ toolCallId: part.toolCallId, toolName: part.toolName, input: part.input as Record<string, unknown> });
            if (part.toolName === "editTool") {
              const editInput = part.input as { summary?: string };
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                const toolCalls = (last.toolCalls ?? []).map((tc) =>
                  tc.toolCallId === part.toolCallId
                    ? { ...tc, title: editInput.summary ?? "Editing…", input: part.input as Record<string, unknown> }
                    : tc,
                );
                updated[updated.length - 1] = { ...last, toolCalls };
                return updated;
              });
            } else if (part.toolName === "tavilySearch" || part.toolName === "tavilyExtract") {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                const toolCalls = (last.toolCalls ?? []).map((tc) =>
                  tc.toolCallId === part.toolCallId
                    ? { ...tc, input: part.input as Record<string, unknown> }
                    : tc,
                );
                updated[updated.length - 1] = { ...last, toolCalls };
                return updated;
              });
            }
          } else if (part.type === "tool-result" && part.toolName === "editTool") {
            setToolCallCount((c) => c + 1);
            resolvedResults.set(part.toolCallId, part.output);
            if (resolvedResults.size === currentStepCalls.length && currentStepCalls.length > 0) {
              flushCompletedStep();
            }
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              const toolCalls = (last.toolCalls ?? []).map((tc) =>
                tc.toolCallId === part.toolCallId
                  ? { ...tc, state: "output-available" as const }
                  : tc,
              );
              updated[updated.length - 1] = { ...last, toolCalls };
              return updated;
            });
          } else if (part.type === "tool-result" && part.toolName === "readTool") {
            setToolCallCount((c) => c + 1);
            resolvedResults.set(part.toolCallId, part.output);
            if (resolvedResults.size === currentStepCalls.length && currentStepCalls.length > 0) {
              flushCompletedStep();
            }
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              const toolCalls = (last.toolCalls ?? []).map((tc) =>
                tc.toolCallId === part.toolCallId
                  ? { ...tc, state: "output-available" as const }
                  : tc,
              );
              updated[updated.length - 1] = { ...last, toolCalls };
              return updated;
            });
          } else if (
            part.type === "tool-approval-request" &&
            part.toolCall?.toolName === "applyToolDefinition"
          ) {
            onGeneratingChange?.(false);
            const input = (part.toolCall?.input ?? {}) as { summary: string };
            const toolCallId = (part.toolCall as { toolCallId?: string } | undefined)?.toolCallId ?? part.approvalId;
            const previewTool = pendingPreview ?? toolSnapshot;
            const originalTool = toolSnapshot;

            const finalStepContent = [
              ...(currentStepText ? [{ type: "text" as const, text: currentStepText }] : []),
              { type: "tool-call" as const, toolCallId, toolName: "applyToolDefinition", input: input as Record<string, unknown> },
            ];
            continuationHistory.push({ role: "assistant", content: finalStepContent } as ModelMessage);

            waitingForApproval = true;
            onStreamingTool?.(previewTool);
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              const toolCalls = (last.toolCalls ?? []).map((tc) =>
                tc.toolCallId === applyToolCallId
                  ? { ...tc, state: "approval-requested" as const, originalTool, previewTool }
                  : tc,
              );
              updated[updated.length - 1] = { ...last, toolCalls };
              return updated;
            });
            setPendingApproval({
              approvalId: part.approvalId,
              toolCallId,
              continuationMessages: continuationHistory,
              previewTool,
              originalTool,
              summary: input.summary,
              messageIndex: assistantMessageIndex,
            });
          } else if (part.type === "tool-result" && part.toolName === "tavilySearch") {
            setToolCallCount((c) => c + 1);
            resolvedResults.set(part.toolCallId, part.output);
            if (resolvedResults.size === currentStepCalls.length && currentStepCalls.length > 0) {
              flushCompletedStep();
            }
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              const toolCalls = (last.toolCalls ?? []).map((tc) =>
                tc.toolCallId === part.toolCallId
                  ? { ...tc, state: "output-available" as const, output: part.output }
                  : tc,
              );
              updated[updated.length - 1] = { ...last, toolCalls };
              return updated;
            });
          } else if (part.type === "tool-result" && part.toolName === "tavilyExtract") {
            setToolCallCount((c) => c + 1);
            resolvedResults.set(part.toolCallId, part.output);
            if (resolvedResults.size === currentStepCalls.length && currentStepCalls.length > 0) {
              flushCompletedStep();
            }
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              const toolCalls = (last.toolCalls ?? []).map((tc) =>
                tc.toolCallId === part.toolCallId
                  ? { ...tc, state: "output-available" as const, output: part.output }
                  : tc,
              );
              updated[updated.length - 1] = { ...last, toolCalls };
              return updated;
            });
          }
        }

        onGeneratingChange?.(false);
        if (!waitingForApproval) onStreamingTool?.(null);

        setMessages((prev) => {
          const messages = prev.filter(
            (m) => m.role !== "assistant" || m.content !== "" || (m.toolCalls && m.toolCalls.length > 0),
          );
          const session: ChatSession = {
            id: sessionIdRef.current,
            toolName: currentTool.name,
            messages,
            updatedAt: Date.now(),
            preview: (messages.find((m) => m.role === "user")?.content ?? "").slice(0, 80),
          };
          saveChatSession(session).catch(() => { });
          return prev;
        });
      } catch (error) {
        onGeneratingChange?.(false);
        onStreamingTool?.(null);
        setPendingApproval(null);
        const isAbort = error instanceof Error && error.name === "AbortError";
        if (isAbort) {
          if (isToolApplied) {
            onApply(toolSnapshot);
          }
        } else {
          toast.error(error instanceof Error ? error.message : "AI request failed");
        }
        setMessages((prev) => prev.slice(0, -2));
      } finally {
        setIsStreaming(false);
      }
    },
    [
      currentTool,
      contextSelection,
      provider,
      currentKeys.key,
      model,
      reasoningEffort,
      tavilyKeys,
      onApply,
      onGeneratingChange,
      onStreamingTool,
    ],
  );

  const sendMessage = useCallback(
    async (textOverride?: string) => {
      const userText = (textOverride ?? input).trim();
      if (!userText || isStreaming || !model) return;

      if (!currentKeys.key) {
        toast.error("API key not configured", {
          description: "Open settings to add your API key.",
        });
        return;
      }

      if (!textOverride) setInput("");
      const history = messages;
      setMessages((prev) => [
        ...prev,
        { role: "user", content: userText },
        { role: "assistant", content: "" },
      ]);
      setIsStreaming(true);
      setToolCallCount(0);
      await runStream(userText, history);
    },
    [input, isStreaming, model, currentKeys.key, messages, runStream],
  );

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const resendFromIndex = useCallback(
    async (index: number, newContent: string) => {
      if (isStreaming || !newContent.trim() || !model || !currentKeys.key) return;
      setPendingApproval(null);
      onStreamingTool?.(null);
      const history = messages.slice(0, index);
      setMessages([
        ...history,
        { role: "user", content: newContent },
        { role: "assistant", content: "" },
      ]);
      setIsStreaming(true);
      await runStream(newContent, history);
    },
    [isStreaming, model, currentKeys.key, messages, runStream, onStreamingTool],
  );

  const clearMessages = useCallback(() => {
    const sessionIdToSave = sessionIdRef.current;
    setMessages((prev) => {
      if (prev.length > 0) {
        const messages = prev.filter(
          (m) => m.role !== "assistant" || m.content !== "" || (m.toolCalls && m.toolCalls.length > 0),
        );
        if (messages.length > 0) {
          const session: ChatSession = {
            id: sessionIdToSave,
            toolName: currentTool.name,
            messages,
            updatedAt: Date.now(),
            preview: (messages.find((m) => m.role === "user")?.content ?? "").slice(0, 80),
          };
          saveChatSession(session)
            .then(() => loadRecentSessions(currentTool.name))
            .then(setRecentSessions)
            .catch(() => { });
        }
      }
      return [];
    });
    setInput("");
    sessionIdRef.current = crypto.randomUUID();
    setPendingApproval(null);
    setToolCallCount(0);
    onStreamingTool?.(null);
  }, [currentTool.name, onStreamingTool]);

  const runContinuation = useCallback(
    async (messages: ModelMessage[], approvedMessageIndex: number, toolSnapshot: Tool) => {
      if (!model || !currentKeys.key) return;

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      setIsStreaming(true);
      abortControllerRef.current = new AbortController();

      try {
        const systemPrompt = generatePrompt(schemaRef.current ? JSON.stringify(schemaRef.current, null, 2) : "{}");
        const aiModel = createModelInstance(provider, currentKeys.key, model);
        let pendingPreview: Tool | null = null;

        const continuationEditTool = createEditTool(
          () => pendingPreview ?? toolSnapshot,
          (t) => { pendingPreview = t; onStreamingTool?.(t); }
        );

        const continuationApplyToolDefinition = createApplyToolDefinitionTool(
          () => { },
          () => {
            if (pendingPreview) {
              onApply(replaceKey(pendingPreview) as Tool);
              pendingPreview = null;
            }
            onStreamingTool?.(null);
          }
        );

        const tavilySearchTool = tavilyKeys.isSaved && tavilyKeys.key
          ? createTavilySearchTool(tavilyKeys.key)
          : undefined;

        const continuationReadTool = createReadTool(() => pendingPreview ?? toolSnapshot);

        const { fullStream } = streamText({
          model: aiModel,
          system: systemPrompt,
          messages,
          tools: {
            editTool: continuationEditTool,
            applyToolDefinition: continuationApplyToolDefinition,
            readTool: continuationReadTool,
            ...(tavilySearchTool ? { tavilySearch: tavilySearchTool } : {}),
          },
          stopWhen: [
            stepCountIs(20), // Maximum 20 steps
            hasToolCall('applyToolDefinition'), // Stop after calling 'applyToolDefinition'
          ],
          abortSignal: abortControllerRef.current.signal,
          onFinish: ({ usage: u }) => setUsage(u),
          providerOptions: (reasoningEffort && MODEL_GROUPS.flatMap((g) => g.models).find((m) => m.value === model)?.reasoning === true
            ? getProviderOptions(provider, model, reasoningEffort)
            : undefined) as Record<string, Record<string, string | number | boolean | null | Record<string, string | number | boolean | null>>> | undefined,
        });

        let fullText = "";
        let reasoningBuffer = "";

        for await (const part of fullStream) {
          if (part.type === "text-delta") {
            fullText += part.text;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { ...updated[updated.length - 1], content: fullText };
              return updated;
            });
          } else if (part.type === "reasoning-delta") {
            reasoningBuffer += part.text;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { ...updated[updated.length - 1], reasoningContent: reasoningBuffer };
              return updated;
            });
          } else if (part.type === "tool-result" && part.toolName === "applyToolDefinition") {
            setToolCallCount((c) => c + 1);
            setMessages((prev) => {
              const updated = [...prev];
              if (approvedMessageIndex < updated.length) {
                const approvedMsg = updated[approvedMessageIndex];
                const toolCalls = (approvedMsg.toolCalls ?? []).map((tc) =>
                  tc.toolName === "applyToolDefinition"
                    ? { ...tc, state: "output-available" as const }
                    : tc,
                );
                updated[approvedMessageIndex] = {
                  ...approvedMsg,
                  toolApplied: true,
                  toolCalls,
                };
              }
              return updated;
            });
          }
        }

        onGeneratingChange?.(false);
        onStreamingTool?.(null);

        setMessages((prev) => {
          const messages = prev.filter(
            (m) => m.role !== "assistant" || m.content !== "" || (m.toolCalls && m.toolCalls.length > 0),
          );
          const session: ChatSession = {
            id: sessionIdRef.current,
            toolName: currentTool.name,
            messages,
            updatedAt: Date.now(),
            preview: (messages.find((m) => m.role === "user")?.content ?? "").slice(0, 80),
          };
          saveChatSession(session).catch(() => { });
          return prev;
        });
      } catch (error) {
        const isAbort = error instanceof Error && error.name === "AbortError";
        if (!isAbort) toast.error(error instanceof Error ? error.message : "AI request failed");
        setMessages((prev) => prev.slice(0, -1));
        onStreamingTool?.(null);
      } finally {
        setIsStreaming(false);
      }
    },
    [currentTool, provider, currentKeys.key, model, reasoningEffort, tavilyKeys, onApply, onGeneratingChange, onStreamingTool],
  );

  const confirmPatch = useCallback(async () => {
    if (!pendingApproval) return;
    const { toolCallId, continuationMessages: priorMessages, previewTool, originalTool, messageIndex } = pendingApproval;

    onApply(replaceKey(previewTool) as Tool);
    onStreamingTool?.(null);

    const continuationMessages: ModelMessage[] = [
      ...priorMessages,
      {
        role: "tool",
        content: [{ type: "tool-result", toolCallId, toolName: "applyToolDefinition", output: { type: "text", value: "Applied successfully. Provide a concise summary of all the changes you made to the tool." } }],
      } as ModelMessage,
    ];
    setPendingApproval(null);
    await runContinuation(continuationMessages, messageIndex, originalTool);
  }, [pendingApproval, runContinuation, onApply, onStreamingTool]);

  const rejectPatch = useCallback(async () => {
    if (!pendingApproval) return;
    const { toolCallId, continuationMessages: priorMessages, originalTool, messageIndex } = pendingApproval;
    const continuationMessages: ModelMessage[] = [
      ...priorMessages,
      {
        role: "tool",
        content: [{ type: "tool-result", toolCallId, toolName: "applyToolDefinition", output: { type: "text", value: "User rejected the changes" } }],
      } as ModelMessage,
    ];
    setPendingApproval(null);
    onStreamingTool?.(null);
    await runContinuation(continuationMessages, messageIndex, originalTool);
  }, [pendingApproval, runContinuation, onStreamingTool]);

  const loadSession = useCallback((session: ChatSession) => {
    setMessages(session.messages);
    sessionIdRef.current = session.id as `${string}-${string}-${string}-${string}-${string}`;
    setPendingApproval(null);
    onStreamingTool?.(null);
  }, [onStreamingTool]);

  return {
    messages,
    input,
    setInput,
    isStreaming,
    model,
    setModel,
    reasoningEffort,
    setReasoningEffort,
    provider,
    sendMessage,
    stopStreaming,
    resendFromIndex,
    clearMessages,
    allProviderKeys,
    tavilyKeys,
    pendingApproval,
    confirmPatch,
    rejectPatch,
    usage,
    toolCallCount,
    recentSessions,
    loadSession,
  };
}

function DiffView({ original, updated }: { original: Tool; updated: Tool }) {
  const aJson = JSON.stringify(exportToStructuredJSON(original), null, 2);
  const bJson = JSON.stringify(exportToStructuredJSON(updated), null, 2);
  const diff = computeLineDiff(aJson, bJson);
  const CONTEXT = 2;
  const changedSet = new Set(diff.flatMap((d, idx) => (d.type !== "same" ? [idx] : [])));
  const visibleSet = new Set<number>();
  for (const idx of changedSet) {
    for (let k = Math.max(0, idx - CONTEXT); k <= Math.min(diff.length - 1, idx + CONTEXT); k++) {
      visibleSet.add(k);
    }
  }
  if (visibleSet.size === 0) {
    return <p className="text-xs text-muted-foreground">No changes</p>;
  }
  const sortedIndices = [...visibleSet].sort((a, b) => a - b);
  const chunks: number[][] = [];
  let current: number[] = [];
  for (let k = 0; k < sortedIndices.length; k++) {
    if (current.length === 0 || sortedIndices[k] === sortedIndices[k - 1] + 1) {
      current.push(sortedIndices[k]);
    } else {
      chunks.push(current);
      current = [sortedIndices[k]];
    }
  }
  if (current.length > 0) chunks.push(current);
  return (
    <div className="max-h-48 overflow-y-auto rounded border border-border/40 bg-muted/20 font-mono text-[11px]">
      {chunks.map((chunk, ci) => (
        <div key={ci}>
          {ci > 0 && (
            <div className="bg-muted/30 px-2 py-0.5 text-muted-foreground">···</div>
          )}
          {chunk.map((lineIdx) => {
            const line = diff[lineIdx];
            return (
              <div
                key={lineIdx}
                className={cn(
                  "whitespace-pre px-2 py-px",
                  line.type === "add" && "bg-green-500/10 text-green-600 dark:text-green-400",
                  line.type === "remove" && "bg-red-500/10 text-red-500 opacity-70 line-through dark:text-red-400",
                  line.type === "same" && "text-muted-foreground",
                )}
              >
                {line.type === "add" ? "+ " : line.type === "remove" ? "- " : "  "}
                {line.text}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

interface WebSearchResult {
  title: string;
  url: string;
  content: string;
}

function WebSearchResults({ results }: { results: WebSearchResult[] }) {
  return (
    <div className="mt-2 space-y-2">
      {results.slice(0, 3).map((r) => {
        let hostname = r.url;
        try {
          hostname = new URL(r.url).hostname;
        } catch { /* ignore */ }
        return (
          <a
            key={r.url}
            href={r.url}
            target="_blank"
            rel="noreferrer"
            className="block rounded-lg border border-border/40 bg-muted/30 px-4 py-3 transition-colors hover:border-border/60"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-medium leading-tight text-foreground hover:underline">
                {r.title}
              </span>
              <span className="shrink-0 rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                {hostname}
              </span>
            </div>
            {r.content && (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.content}</p>
            )}
            <p className="mt-2 text-[10px] uppercase tracking-wide text-muted-foreground">{hostname}</p>
          </a>
        );
      })}
    </div>
  );
}

interface ExtractResult {
  url: string;
  raw_content: string;
  hasMore?: boolean;
}

function ExtractedContent({ results }: { results: ExtractResult[] }) {
  return (
    <div className="mt-2 space-y-2">
      {results.map((r) => {
        let hostname = r.url;
        try {
          hostname = new URL(r.url).hostname;
        } catch { /* ignore */ }
        return (
          <div key={r.url} className="rounded border border-border/40 bg-muted/20">
            <div className="flex items-center justify-between border-b border-border/30 px-3 py-1.5">
              <a
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-muted-foreground hover:text-foreground hover:underline"
              >
                {hostname}
              </a>
              {r.hasMore && (
                <span className="text-[10px] text-muted-foreground">partial</span>
              )}
            </div>
            <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap wrap-break-word px-3 py-2 font-mono text-[11px] text-muted-foreground">
              {r.raw_content}
            </pre>
          </div>
        );
      })}
    </div>
  );
}

interface MessagePartProps {
  msg: ChatMessage;
  index: number;
  isLast: boolean;
  isStreaming: boolean;
  editingIndex: number | null;
  editingValue: string;
  setEditingIndex: (i: number | null) => void;
  setEditingValue: (v: string) => void;
  onResend: (index: number, content: string) => void;
  onRetry: () => void;
  pendingApproval: { approvalId: string; previewTool: Tool; originalTool: Tool; summary: string; messageIndex: number } | null;
  onConfirmPatch: () => void;
  onRejectPatch: () => void;
}

function MessagePart({
  msg,
  index,
  isLast,
  isStreaming,
  editingIndex,
  editingValue,
  setEditingIndex,
  setEditingValue,
  onResend,
  onRetry,
  pendingApproval,
  onConfirmPatch,
  onRejectPatch,
}: MessagePartProps) {
  const chainCalls = msg.toolCalls?.filter((tc) => tc.toolName !== "applyToolDefinition") ?? [];
  const applyToolCall = msg.toolCalls?.find((tc) => tc.toolName === "applyToolDefinition");
  const isPending = applyToolCall && pendingApproval?.messageIndex === index;

  return (
    <Message from={msg.role}>
      {chainCalls.length > 0 && (
        <ChainOfThought defaultOpen>
          <ChainOfThoughtHeader />
          <ChainOfThoughtContent>
            {chainCalls.map((tc) => (
              <ChainOfThoughtStep
                key={tc.toolCallId}
                icon={
                  tc.toolName === "tavilySearch"
                    ? SearchIcon
                    : tc.toolName === "tavilyExtract"
                      ? LinkIcon
                      : tc.toolName === "readTool"
                        ? HashIcon
                        : PencilIcon
                }
                label={
                  tc.toolName === "tavilySearch"
                    ? tc.input.query
                      ? `Searching "${tc.input.query as string}"`
                      : "Searching the web…"
                    : tc.toolName === "tavilyExtract"
                      ? tc.state === "output-available"
                        ? (() => {
                          const urls = (tc.input.urls as string[] | undefined) ?? [];
                          try { return `Extracted from ${new URL(urls[0]).hostname}`; } catch { return "Extracted content"; }
                        })()
                        : "Extracting content…"
                      : (tc.title ?? "Editing…")
                }
                status={tc.state === "output-available" ? "complete" : "active"}
              >
                {tc.toolName === "tavilySearch" && tc.state === "output-available" && (
                  <WebSearchResults
                    results={
                      ((tc.output as { results?: WebSearchResult[] })?.results ?? [])
                    }
                  />
                )}
                {tc.toolName === "tavilyExtract" && tc.state === "output-available" && (
                  <ExtractedContent
                    results={
                      ((tc.output as { results?: ExtractResult[] })?.results ?? [])
                    }
                  />
                )}
              </ChainOfThoughtStep>
            ))}
          </ChainOfThoughtContent>
        </ChainOfThought>
      )}
      {applyToolCall && (
        <ToolCard className="w-full" defaultOpen={!!isPending}>
          <ToolHeader
            type="tool-applyToolDefinition"
            state={applyToolCall.state}
          />
          <ToolContent>
            {(applyToolCall.originalTool && applyToolCall.previewTool) && (
              <DiffView original={applyToolCall.originalTool} updated={applyToolCall.previewTool} />
            )}
            {isPending && (
              <div className="flex flex-col gap-2 pt-2">
                <p className="text-xs text-muted-foreground">{pendingApproval.summary}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="h-7 px-3"
                    onClick={onConfirmPatch}
                  >
                    <CheckIcon className="mr-1 h-3 w-3" />
                    Apply
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-3"
                    onClick={onRejectPatch}
                  >
                    <XIcon className="mr-1 h-3 w-3" />
                    Dismiss
                  </Button>
                </div>
              </div>
            )}
          </ToolContent>
        </ToolCard>
      )}
      {msg.role === "user" ? (
        editingIndex === index ? (
          <div className="flex w-full flex-col gap-1.5">
            <Textarea
              className="field-sizing-fixed min-h-16 resize-none text-sm"
              value={editingValue}
              autoFocus
              onChange={(e) => setEditingValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onResend(index, editingValue);
                  setEditingIndex(null);
                } else if (e.key === "Escape") {
                  setEditingIndex(null);
                }
              }}
            />
            <div className="flex justify-end gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2"
                onClick={() => setEditingIndex(null)}
              >
                <XIcon className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                className="h-7 px-2"
                disabled={!editingValue.trim()}
                onClick={() => {
                  onResend(index, editingValue);
                  setEditingIndex(null);
                }}
              >
                <CheckIcon className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <MessageContent className="whitespace-pre-wrap">{msg.content}</MessageContent>
            {!isStreaming && (
              <MessageActions>
                <MessageAction
                  tooltip="Edit message"
                  onClick={() => {
                    setEditingIndex(index);
                    setEditingValue(msg.content);
                  }}
                >
                  <PencilIcon className="h-3 w-3" />
                </MessageAction>
              </MessageActions>
            )}
          </>
        )
      ) : (
        <>
          {msg.reasoningContent && (
            <Reasoning isStreaming={isStreaming && isLast && !msg.content}>
              <ReasoningTrigger />
              <ReasoningContent>{msg.reasoningContent}</ReasoningContent>
            </Reasoning>
          )}
          <MessageContent>
            {msg.content ? (
              <MessageResponse>{msg.content}</MessageResponse>
            ) : isStreaming && isLast && !applyToolCall ? (
              <div className="space-y-1.5 py-0.5">
                <Shimmer className="text-sm">Generating response...</Shimmer>
              </div>
            ) : null}
          </MessageContent>
          {msg.content && !isStreaming && isLast && (
            <MessageActions>
              <MessageAction
                tooltip="Retry"
                onClick={onRetry}
              >
                <RefreshCcwIcon className="h-3 w-3" />
              </MessageAction>
              <MessageAction
                tooltip="Copy"
                onClick={() => navigator.clipboard.writeText(msg.content)}
              >
                <CopyIcon className="h-3 w-3" />
              </MessageAction>
            </MessageActions>
          )}
        </>
      )}
      {msg.toolApplied && (
        <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
          <CheckIcon className="h-3 w-3" />
          <span>Applied</span>
        </div>
      )}
    </Message>
  );
}

interface AIChatPanelProps {
  tool: Tool;
  onApply: (tool: Tool) => void;
  isOpen: boolean;
  onStreamingTool?: (tool: Tool | null) => void;
  onGeneratingChange?: (isGenerating: boolean) => void;
}

export function AIChatPanel({
  tool,
  onApply,
  isOpen,
  onStreamingTool,
  onGeneratingChange,
}: AIChatPanelProps) {
  const { contextSelection, clearContextSelection, tool: currentTool } = useToolBuilder();
  const chat = useAIChat(tool, onApply, onStreamingTool, onGeneratingChange);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const contextCommands = currentTool.commands.filter((c) =>
    contextSelection.commandKeys.includes(c.key),
  );
  const contextParameters = currentTool.parameters.filter((p) =>
    contextSelection.parameterKeys.includes(p.key),
  );
  const hasContextItems = contextCommands.length > 0 || contextParameters.length > 0;

  return (
    <div
      className={cn(
        "flex h-full shrink-0 flex-col border-l border-border/50 bg-background transition-[width,opacity] duration-200",
        isOpen ? "w-1/4 opacity-100" : "w-0 overflow-hidden opacity-0",
      )}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-3 py-2">
        <span className="text-sm font-bold">AI Generate</span>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            disabled={chat.messages.length === 0}
            onClick={chat.clearMessages}
          >
            <SquarePenIcon className="h-3.5 w-3.5" />
          </Button>
          <ApiKeySettings
            allProviderKeys={chat.allProviderKeys}
            tavilyKeys={chat.tavilyKeys}
          />
        </div>
      </div>

      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="gap-3 p-3">
          {chat.messages.length === 0 ? (
            <ConversationEmptyState>
              <div className="text-muted-foreground">
                <SparklesIcon className="size-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-medium">Generate or modify this tool</h3>
                <p className="text-sm text-muted-foreground">
                  Describe what you want or ask to modify the tool
                </p>
              </div>
              {chat.recentSessions.length > 0 && (
                <div className="w-full space-y-1.5">
                  <p className="text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Recent sessions
                  </p>
                  <div className="flex flex-col gap-1">
                    {chat.recentSessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => chat.loadSession(session)}
                        className="flex w-full items-start justify-between gap-2 rounded border border-border/40 bg-muted/30 px-3 py-2 text-left text-xs transition-colors hover:border-border/60 hover:bg-muted/50"
                      >
                        <span className="line-clamp-1 flex-1 text-foreground">{session.preview || "Empty session"}</span>
                        <span className="shrink-0 text-muted-foreground">{formatRelativeTime(session.updatedAt)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <Suggestions className="mt-2 justify-center">
                {PROMPT_PILLS.map((pill) => (
                  <Suggestion
                    key={pill.label}
                    suggestion={pill.text}
                    onClick={chat.sendMessage}
                    disabled={chat.isStreaming}
                    className="text-xs"
                  >
                    {pill.label}
                  </Suggestion>
                ))}
              </Suggestions>
            </ConversationEmptyState>
          ) : (
            chat.messages.map((msg, i) => (
              <MessagePart
                key={i}
                msg={msg}
                index={i}
                isLast={i === chat.messages.length - 1}
                isStreaming={chat.isStreaming}
                editingIndex={editingIndex}
                editingValue={editingValue}
                setEditingIndex={setEditingIndex}
                setEditingValue={setEditingValue}
                onResend={chat.resendFromIndex}
                onRetry={() => chat.resendFromIndex(i - 1, chat.messages[i - 1]?.content ?? "")}
                pendingApproval={chat.pendingApproval}
                onConfirmPatch={chat.confirmPatch}
                onRejectPatch={chat.rejectPatch}
              />
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="shrink-0 border-t border-border/50 p-3">
        <PromptInput
          onSubmit={({ text }) => {
            if (!chat.isStreaming && text.trim()) {
              chat.setInput("");
              chat.sendMessage(text);
            }
          }}
        >
          {hasContextItems && (
            <PromptInputHeader className="flex-wrap gap-1 px-2 pt-2 pb-0">
              {contextCommands.map((cmd) => (
                <span
                  key={cmd.key}
                  className="flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs italic"
                >
                  <TerminalIcon className="h-3 w-3 shrink-0 text-muted-foreground" />
                  {cmd.name}
                </span>
              ))}
              {contextParameters.map((param) => (
                <span
                  key={param.key}
                  className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs italic"
                >
                  {param.parameterType === "Flag" ? (
                    <FlagIcon className="h-3 w-3 shrink-0 text-primary/70" />
                  ) : (
                    <HashIcon className="h-3 w-3 shrink-0 text-primary/70" />
                  )}
                  {param.name}
                  {param.longFlag && <span className="text-primary/60">{param.longFlag}</span>}
                </span>
              ))}
              <button
                onClick={clearContextSelection}
                className="ml-1 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear all
              </button>
            </PromptInputHeader>
          )}
          <PromptInputBody>
            <PromptInputTextarea
              placeholder="Ask AI to modify the tool…"
              value={chat.input}
              onChange={(e) => chat.setInput(e.currentTarget.value)}
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              <ModelPicker
                model={chat.model}
                setModel={chat.setModel}
                provider={chat.provider}
                allProviderKeys={chat.allProviderKeys}
              />
              <ReasoningEffortPicker
                model={chat.model}
                effort={chat.reasoningEffort}
                onEffortChange={chat.setReasoningEffort}
              />
            </PromptInputTools>
            <div className="flex items-center gap-1">
              {chat.usage && (
                <Context
                  usedTokens={chat.usage.inputTokens ?? 0}
                  maxTokens={MODEL_MAX_TOKENS[chat.model] ?? DEFAULT_MAX_TOKENS}
                  usage={chat.usage}
                  modelId={chat.model}
                >
                  <ContextTrigger />
                  <ContextContent>
                    <ContextContentHeader />
                    <ContextContentBody>
                      <ContextInputUsage />
                      <ContextOutputUsage />
                      <ContextReasoningUsage />
                      <ContextCacheUsage />
                      {chat.toolCallCount > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Tool calls</span>
                          <span>{chat.toolCallCount}</span>
                        </div>
                      )}
                    </ContextContentBody>
                    <ContextContentFooter />
                  </ContextContent>
                </Context>
              )}
              <PromptInputSubmit
                status={chat.isStreaming ? "streaming" : "ready"}
                disabled={
                  !chat.isStreaming &&
                  (!chat.allProviderKeys[chat.provider as Exclude<AIProvider, "tavily">]?.key ||
                    !chat.model)
                }
                onStop={chat.stopStreaming}
              />
            </div>
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
