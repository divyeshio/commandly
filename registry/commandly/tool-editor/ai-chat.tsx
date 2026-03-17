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
  Tool as ToolCard,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { generatePrompt } from "@/components/tool-editor-ui/prompt";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAIKeys, type AIProvider } from "@/lib/ai-keys";
import { cn, replaceKey } from "@/lib/utils";
import { Tool } from "@/registry/commandly/lib/types/commandly";
import { exportToStructuredJSON } from "@/registry/commandly/lib/utils/commandly";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createMistral } from "@ai-sdk/mistral";
import { createOpenAI } from "@ai-sdk/openai";
import { createXai } from "@ai-sdk/xai";
import { stepCountIs, streamText, tool } from "ai";
import {
  CheckIcon,
  ChevronsUpDownIcon,
  CopyIcon,
  GlobeIcon,
  PencilIcon,
  RefreshCcwIcon,
  SendIcon,
  Settings2Icon,
  SparklesIcon,
  SquareIcon,
  SquarePenIcon,
  XIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

interface ToolCallEntry {
  toolCallId: string;
  toolName: string;
  title: string;
  input: Record<string, unknown>;
  state: "input-available" | "output-available" | "output-error";
  output?: unknown;
  errorText?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  toolApplied?: boolean;
  toolCalls?: ToolCallEntry[];
  isEditing?: boolean;
  editingContent?: string;
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

const MODEL_GROUPS: {
  provider: AIProvider;
  label: string;
  logoUrl: string;
  keyPlaceholder: string;
  models: { value: string; label: string }[];
}[] = [
  {
    provider: "openai",
    label: "OpenAI",
    logoUrl: "https://www.google.com/s2/favicons?domain=openai.com&sz=32",
    keyPlaceholder: "sk-...",
    models: [
      { value: "gpt-5-2025-08-07", label: "GPT-5" },
      { value: "gpt-5.4-2026-03-05", label: "GPT-5.4" },
      { value: "gpt-5-mini-2025-08-07", label: "GPT-5 mini" },
      { value: "gpt-5-nano-2025-08-07", label: "GPT-5 nano" },
      { value: "gpt-5-codex", label: "GPT-5 Codex" },
      { value: "gpt-5.3-codex", label: "GPT-5.3 Codex" },
      { value: "gpt-5.2-codex", label: "GPT-5.2 Codex" },
      { value: "gpt-5.1-codex", label: "GPT-5.1 Codex" },
      { value: "gpt-5.1-codex-mini", label: "GPT-5.1 Codex mini" },
      { value: "o4-mini-2025-04-16", label: "o4-mini" },
      { value: "o3-2025-04-16", label: "o3" },
      { value: "gpt-4.1-2025-04-14", label: "GPT-4.1" },
      { value: "gpt-4.1-mini-2025-04-14", label: "GPT-4.1 mini" },
      { value: "gpt-4.1-nano-2025-04-14", label: "GPT-4.1 nano" },
    ],
  },
  {
    provider: "anthropic",
    label: "Anthropic",
    logoUrl: "https://www.google.com/s2/favicons?domain=anthropic.com&sz=32",
    keyPlaceholder: "sk-ant-...",
    models: [
      { value: "claude-opus-4-6", label: "Claude Opus 4.6" },
      { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
      { value: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
      { value: "claude-opus-4-5", label: "Claude Opus 4.5" },
      { value: "claude-sonnet-4-5", label: "Claude Sonnet 4.5" },
    ],
  },
  {
    provider: "google",
    label: "Google",
    logoUrl: "https://www.google.com/s2/favicons?domain=google.com&sz=32",
    keyPlaceholder: "AIza...",
    models: [
      { value: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro" },
      { value: "gemini-3-flash-preview", label: "Gemini 3 Flash" },
      { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
    ],
  },
  {
    provider: "groq",
    label: "Groq",
    logoUrl: "https://www.google.com/s2/favicons?domain=groq.com&sz=32",
    keyPlaceholder: "gsk_...",
    models: [
      { value: "meta-llama/llama-4-maverick-17b-128e-instruct", label: "Llama 4 Maverick" },
      { value: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout" },
      { value: "qwen/qwen3-32b", label: "Qwen 3 32B" },
      { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
      { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B" },
    ],
  },
  {
    provider: "mistral",
    label: "Mistral",
    logoUrl: "https://www.google.com/s2/favicons?domain=mistral.ai&sz=32",
    keyPlaceholder: "...",
    models: [
      { value: "mistral-large-latest", label: "Mistral Large" },
      { value: "magistral-medium-latest", label: "Magistral Medium" },
      { value: "codestral-latest", label: "Codestral" },
      { value: "mistral-medium-latest", label: "Mistral Medium" },
      { value: "mistral-small-latest", label: "Mistral Small" },
    ],
  },
  {
    provider: "xai",
    label: "xAI",
    logoUrl: "https://www.google.com/s2/favicons?domain=x.ai&sz=32",
    keyPlaceholder: "xai-...",
    models: [
      { value: "grok-4-0709", label: "Grok 4" },
      { value: "grok-3", label: "Grok 3" },
      { value: "grok-3-mini", label: "Grok 3 mini" },
    ],
  },
];

function providerForModel(model: string): AIProvider {
  if (model.startsWith("claude")) return "anthropic";
  if (model.startsWith("gemini")) return "google";
  if (model.startsWith("llama") || model.startsWith("meta-llama") || model.startsWith("qwen"))
    return "groq";
  if (model.startsWith("mistral") || model.startsWith("codestral") || model.startsWith("magistral"))
    return "mistral";
  if (model.startsWith("grok")) return "xai";
  return "openai";
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

function tryParsePartialTool(json: string): Tool | null {
  if (!json.trim()) return null;
  try {
    const parsed = JSON.parse(json) as Tool;
    if (parsed?.name && Array.isArray(parsed?.commands) && Array.isArray(parsed?.parameters))
      return parsed;
  } catch {
    /* continue */
  }

  const lines = json.split("\n");
  let candidate = lines.slice(0, -1).join("\n").trimEnd().replace(/,\s*$/, "");
  if (!candidate) return null;

  const stack: string[] = [];
  let inStr = false;
  let escaped = false;
  for (const ch of candidate) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\" && inStr) {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inStr = !inStr;
      continue;
    }
    if (inStr) continue;
    if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if (ch === "}" || ch === "]") stack.pop();
  }
  candidate += stack.reverse().join("");

  try {
    const parsed = JSON.parse(candidate) as Tool;
    if (parsed?.name && Array.isArray(parsed?.commands) && Array.isArray(parsed?.parameters))
      return parsed;
  } catch {
    /* ignore */
  }

  return null;
}

function useAIChat(
  currentTool: Tool,
  onApply: (tool: Tool) => void,
  context: { selectedCommandName?: string; selectedParameterName?: string },
  onStreamingTool?: (tool: Tool | null) => void,
  onGeneratingChange?: (isGenerating: boolean) => void,
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [model, setModel] = useState(MODEL_GROUPS[0].models[0].value);
  const schemaRef = useRef<object | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const toolSnapshotRef = useRef<Tool | null>(null);
  const isToolAppliedRef = useRef(false);

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
      .catch(() => {});
  }, []);

  const runStream = useCallback(
    async (userText: string, history: ChatMessage[]) => {
      abortControllerRef.current = new AbortController();
      toolSnapshotRef.current = currentTool;
      isToolAppliedRef.current = false;

      try {
        const toolJson = JSON.stringify(exportToStructuredJSON(currentTool), null, 2);
        const schema = schemaRef.current ? JSON.stringify(schemaRef.current, null, 2) : "{}";
        const systemPrompt = generatePrompt(schema, {
          currentToolJson: toolJson,
          context: {
            selectedCommand: context.selectedCommandName,
            selectedParameter: context.selectedParameterName,
          },
        });
        const aiModel = createModelInstance(provider, currentKeys.key, model);
        const userMessage: ChatMessage = { role: "user", content: userText };

        const editToolDef = tool({
          description: "Apply the updated CLI tool definition to the editor.",
          inputSchema: z.object({
            name: z.string(),
            displayName: z.string().optional(),
            description: z.string().optional(),
            version: z.string().optional(),
            url: z.string().optional(),
            category: z.string().optional(),
            tags: z.array(z.string()).optional(),
            commands: z.array(z.any()),
            parameters: z.array(z.any()),
          }),
          execute: async (input) => {
            try {
              isToolAppliedRef.current = true;
              onApply(replaceKey(input as unknown as Tool) as Tool);
              return { success: true };
            } catch {
              return { success: false };
            }
          },
        });

        const webSearchTool =
          tavilyKeys.isSaved && tavilyKeys.key
            ? tool({
                description:
                  "Search the web for CLI tool documentation, help text, or related information.",
                inputSchema: z.object({ query: z.string().describe("The search query") }),
                execute: async ({ query }: { query: string }) => {
                  const resp = await fetch("https://api.tavily.com/search", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      api_key: tavilyKeys.key,
                      query,
                      search_depth: "basic",
                      max_results: 5,
                    }),
                  });
                  if (!resp.ok) throw new Error("Web search failed");
                  const data = (await resp.json()) as {
                    results?: { title: string; url: string; content: string }[];
                  };
                  return (
                    data.results?.map((r) => ({
                      title: r.title,
                      url: r.url,
                      content: r.content,
                    })) ?? []
                  );
                },
              })
            : undefined;

        const { fullStream } = streamText({
          model: aiModel,
          system: systemPrompt,
          messages: [...history, userMessage].map((m) => ({ role: m.role, content: m.content })),
          tools: {
            editTool: editToolDef,
            ...(webSearchTool ? { webSearch: webSearchTool } : {}),
          },
          stopWhen: stepCountIs(5),
          abortSignal: abortControllerRef.current.signal,
        });

        let fullText = "";
        let editToolCallId: string | null = null;
        let editToolBuffer = "";

        for await (const part of fullStream) {
          if (part.type === "text-delta") {
            fullText += part.text;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: "assistant",
                content: fullText,
                toolCalls: updated[updated.length - 1].toolCalls,
                toolApplied: updated[updated.length - 1].toolApplied,
              };
              return updated;
            });
          } else if (part.type === "tool-input-start" && part.toolName === "editTool") {
            editToolCallId = part.id;
            onGeneratingChange?.(true);
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              const entry: ToolCallEntry = {
                toolCallId: part.id,
                toolName: "editTool",
                title: "Applying changes",
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
            part.type === "tool-input-delta" &&
            editToolCallId &&
            part.id === editToolCallId
          ) {
            editToolBuffer += part.delta;
            const partial = tryParsePartialTool(editToolBuffer);
            if (partial) onStreamingTool?.(partial);
          } else if (part.type === "tool-call" && part.toolName === "webSearch") {
            const query = (part.input as { query: string }).query;
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              const entry: ToolCallEntry = {
                toolCallId: part.toolCallId,
                toolName: "webSearch",
                title: "Web Search",
                input: { query },
                state: "input-available",
              };
              updated[updated.length - 1] = {
                ...last,
                toolCalls: [...(last.toolCalls ?? []), entry],
              };
              return updated;
            });
          } else if (part.type === "tool-result" && part.toolName === "webSearch") {
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
          } else if (part.type === "tool-result" && part.toolName === "editTool") {
            onGeneratingChange?.(false);
            onStreamingTool?.(null);
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              const toolCalls = (last.toolCalls ?? []).map((tc) =>
                tc.toolCallId === editToolCallId
                  ? { ...tc, state: "output-available" as const, output: part.output }
                  : tc,
              );
              updated[updated.length - 1] = { ...last, toolCalls, toolApplied: true };
              return updated;
            });
          }
        }

        onGeneratingChange?.(false);
        onStreamingTool?.(null);
      } catch (error) {
        onGeneratingChange?.(false);
        onStreamingTool?.(null);
        const isAbort = error instanceof Error && error.name === "AbortError";
        if (isAbort) {
          if (isToolAppliedRef.current && toolSnapshotRef.current) {
            onApply(toolSnapshotRef.current);
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
      context,
      provider,
      currentKeys.key,
      model,
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
      const history = messages.slice(0, index);
      setMessages([
        ...history,
        { role: "user", content: newContent },
        { role: "assistant", content: "" },
      ]);
      setIsStreaming(true);
      await runStream(newContent, history);
    },
    [isStreaming, model, currentKeys.key, messages, runStream],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setInput("");
  }, []);

  return {
    messages,
    input,
    setInput,
    isStreaming,
    model,
    setModel,
    provider,
    sendMessage,
    stopStreaming,
    resendFromIndex,
    clearMessages,
    allProviderKeys,
    tavilyKeys,
  };
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
}: MessagePartProps) {
  return (
    <Message from={msg.role}>
      {msg.toolCalls?.map((tc) => (
        <ToolCard
          key={tc.toolCallId}
          className="w-full"
        >
          <ToolHeader
            type="dynamic-tool"
            toolName={tc.toolName}
            title={tc.title}
            state={tc.state}
          />
          {tc.toolName !== "editTool" && (
            <ToolContent>
              <ToolInput input={tc.input} />
              {tc.state === "output-available" && (
                <ToolOutput
                  output={tc.output}
                  errorText={tc.errorText}
                />
              )}
            </ToolContent>
          )}
        </ToolCard>
      ))}
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
            <MessageContent>{msg.content}</MessageContent>
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
          <MessageContent>
            {msg.content ? (
              <MessageResponse>{msg.content}</MessageResponse>
            ) : (
              <div className="space-y-1.5 py-0.5">
                <Shimmer className="text-sm">Generating response...</Shimmer>
              </div>
            )}
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
  const { selectedCommand, selectedParameter } = useToolBuilder();
  const chat = useAIChat(
    tool,
    onApply,
    {
      selectedCommandName: selectedCommand?.name,
      selectedParameterName: selectedParameter?.name ?? undefined,
    },
    onStreamingTool,
    onGeneratingChange,
  );
  const [modelOpen, setModelOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(chat.provider);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const currentGroup = MODEL_GROUPS.find((g) => g.provider === chat.provider);
  const currentModelLabel =
    MODEL_GROUPS.flatMap((g) => g.models).find((m) => m.value === chat.model)?.label ?? chat.model;
  const selectedGroup =
    MODEL_GROUPS.find((g) => g.provider === selectedProvider) ?? MODEL_GROUPS[0];
  const selectedProviderKeys =
    chat.allProviderKeys[selectedProvider as Exclude<AIProvider, "tavily">];

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
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
              >
                <Settings2Icon className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-80"
              side="bottom"
              align="end"
            >
              <p className="mb-3 text-sm font-medium">API Keys</p>
              <div className="flex max-h-72 flex-col gap-4 overflow-y-auto pr-1">
                {MODEL_GROUPS.map((g, gi) => {
                  const keys = chat.allProviderKeys[g.provider as Exclude<AIProvider, "tavily">];
                  return (
                    <div key={g.provider}>
                      {gi > 0 && <Separator className="mb-4" />}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1.5">
                          <img
                            src={g.logoUrl}
                            alt={g.label}
                            className="h-4 w-4 rounded"
                          />
                          <span className="text-xs font-medium">{g.label}</span>
                          {keys.isSaved && <CheckIcon className="ml-auto h-3 w-3 text-green-600" />}
                        </div>
                        <Input
                          type="password"
                          value={keys.key}
                          onChange={(e) => keys.setKey(e.target.value)}
                          className="h-8 text-xs"
                          placeholder={g.keyPlaceholder}
                        />
                        <div className="flex items-center gap-1.5">
                          <Checkbox
                            id={`${g.provider}-save-key`}
                            checked={keys.isSaved}
                            onCheckedChange={(c) =>
                              keys.setSaved(c === "indeterminate" ? false : c)
                            }
                          />
                          <Label
                            htmlFor={`${g.provider}-save-key`}
                            className="cursor-pointer text-xs"
                          >
                            Save key locally
                          </Label>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <Separator />
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    <GlobeIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium">Tavily (Web Search)</span>
                    {chat.tavilyKeys.isSaved && (
                      <CheckIcon className="ml-auto h-3 w-3 text-green-600" />
                    )}
                  </div>
                  <Input
                    type="password"
                    value={chat.tavilyKeys.key}
                    onChange={(e) => chat.tavilyKeys.setKey(e.target.value)}
                    className="h-8 text-xs"
                    placeholder="tvly-..."
                  />
                  <div className="flex items-center gap-1.5">
                    <Checkbox
                      id="tavily-save-key"
                      checked={chat.tavilyKeys.isSaved}
                      onCheckedChange={(c) =>
                        chat.tavilyKeys.setSaved(c === "indeterminate" ? false : c)
                      }
                    />
                    <Label
                      htmlFor="tavily-save-key"
                      className="cursor-pointer text-xs"
                    >
                      Save key locally
                    </Label>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
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
              <Suggestions className="justify-center">
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
              />
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="flex shrink-0 flex-col gap-2 border-t border-border/50 p-3">
        <div className="flex gap-2">
          <Textarea
            className="field-sizing-fixed min-h-24 flex-1 resize-none"
            placeholder="Ask AI to modify the tool…"
            value={chat.input}
            onChange={(e) => chat.setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                chat.sendMessage();
              }
            }}
          />
          <Button
            size="sm"
            disabled={
              !chat.isStreaming &&
              (!chat.input.trim() ||
                !chat.allProviderKeys[chat.provider as Exclude<AIProvider, "tavily">]?.key ||
                !chat.model)
            }
            onClick={() => (chat.isStreaming ? chat.stopStreaming() : chat.sendMessage())}
            className="self-end"
          >
            {chat.isStreaming ? (
              <SquareIcon className="h-4 w-4" />
            ) : (
              <SendIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
        <Popover
          open={modelOpen}
          onOpenChange={(open) => {
            setModelOpen(open);
            if (open) setSelectedProvider(chat.provider);
          }}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-8 w-fit justify-between gap-2 px-2 text-xs"
            >
              <div className="flex items-center gap-1.5">
                {currentGroup && (
                  <img
                    src={currentGroup.logoUrl}
                    alt={currentGroup.label}
                    className="h-4 w-4 rounded"
                  />
                )}
                {currentModelLabel}
              </div>
              <ChevronsUpDownIcon className="h-3 w-3 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-80 p-2"
            align="start"
          >
            <div className="flex gap-2">
              <div className="flex w-12 flex-col gap-1 border-r border-border/50 pr-2">
                {MODEL_GROUPS.map((g) => {
                  const isKeyConfigured =
                    chat.allProviderKeys[g.provider as Exclude<AIProvider, "tavily">]?.isSaved;
                  return (
                    <button
                      key={g.provider}
                      onClick={() => setSelectedProvider(g.provider)}
                      title={`${g.label}${!isKeyConfigured ? " (no API key)" : ""}`}
                      className={cn(
                        "flex h-9 w-10 items-center justify-center rounded border border-transparent transition-all",
                        selectedProvider === g.provider
                          ? "border-border bg-accent"
                          : "opacity-50 hover:bg-muted hover:opacity-80",
                      )}
                    >
                      <img
                        src={g.logoUrl}
                        alt={g.label}
                        className="h-5 w-5 rounded"
                      />
                    </button>
                  );
                })}
              </div>
              <div className="flex-1">
                <p className="mb-1.5 px-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                  {selectedGroup.label}
                </p>
                {!selectedProviderKeys?.isSaved && (
                  <p className="mb-1.5 px-1 text-[10px] text-amber-500">No API key configured</p>
                )}
                {selectedGroup.models.map((m) => {
                  const isKeyConfigured = selectedProviderKeys?.isSaved;
                  return (
                    <button
                      key={m.value}
                      disabled={!isKeyConfigured}
                      onClick={() => {
                        chat.setModel(m.value);
                        setModelOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded px-2 py-2 text-xs transition-colors",
                        isKeyConfigured
                          ? "cursor-pointer hover:bg-accent hover:text-accent-foreground"
                          : "cursor-not-allowed opacity-40",
                        chat.model === m.value && "bg-accent text-accent-foreground",
                      )}
                    >
                      {m.label}
                      {chat.model === m.value && <CheckIcon className="h-3 w-3" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
