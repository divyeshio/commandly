import {
  type ChatMessage,
  countCompletedToolCalls,
  findPendingApproval,
  toChatMessage,
} from "../ai-chat/ai-chat-message-mapping";
import { type ChatWithPreview } from "../ai-chat/ai-chat-persistence";
import { ApiKeySettings } from "../ai-chat/api-key-settings";
import { DiffView } from "../ai-chat/diff-view";
import { ExtractedContent, type ExtractResult } from "../ai-chat/extracted-content";
import {
  ModelPicker,
  ReasoningEffortPicker,
  getProviderOptions,
  providerForModel,
  MODEL_GROUPS,
} from "../ai-chat/model-picker";
import { WebSearchResults, type WebSearchResult } from "../ai-chat/web-search-results";
import { ChatStore } from "./ai-chat-store";
import { generatePrompt } from "./prompt";
import { useToolBuilder } from "./tool-editor.context";
import {
  createApplyToolDefinitionTool,
  createEditTool,
  createReadTool,
  createTavilyExtractTool,
  createTavilySearchTool,
} from "./tools";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
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
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { Tool as ToolCard, ToolContent, ToolHeader } from "@/components/ai-elements/tool";
import { Tool } from "@/components/commandly/types/flat";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { useAIKeys, type AIProvider } from "@/lib/ai-keys";
import { cn, replaceKey } from "@/lib/utils";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createMistral } from "@ai-sdk/mistral";
import { createOpenAI } from "@ai-sdk/openai";
import { Chat, useChat } from "@ai-sdk/react";
import { createXai } from "@ai-sdk/xai";
import {
  DirectChatTransport,
  ToolLoopAgent,
  lastAssistantMessageIsCompleteWithApprovalResponses,
  type InferUITools,
  type LanguageModelUsage,
  type Tool as AISDKTool,
  type UIMessage,
} from "ai";
import {
  CheckIcon,
  ChevronRightIcon,
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
import { useMemo, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";

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
  o1: 200000,
  o3: 200000,
  "o4-mini": 200000,
  "gemini-2.0-flash": 1048576,
  "gemini-2.5-pro": 1048576,
  "grok-3": 131072,
  "llama-3.3-70b-versatile": 128000,
};
const DEFAULT_MAX_TOKENS = 128_000;

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

type ChatProviderOptions = Record<
  string,
  Record<
    string,
    string | number | boolean | null | Record<string, string | number | boolean | null>
  >
>;
type AgentUIMessage = UIMessage<unknown, never, InferUITools<Record<string, AISDKTool>>>;

function createToolLoopAgent({
  model,
  instructions,
  tools,
  providerOptions,
  onFinish,
}: {
  model: ReturnType<typeof createModelInstance>;
  instructions: string;
  tools: Record<string, AISDKTool>;
  providerOptions?: ChatProviderOptions;
  onFinish: ({ usage }: { usage: LanguageModelUsage }) => void;
}) {
  return new ToolLoopAgent({
    model,
    instructions,
    tools,
    providerOptions,
    onFinish,
  });
}

function useAIChat(
  currentTool: Tool,
  onApply: (tool: Tool) => void,
  onStreamingTool?: (tool: Tool | null) => void,
  onGeneratingChange?: (isGenerating: boolean) => void,
) {
  const { contextSelection } = useToolBuilder();
  const [store] = useState(() => new ChatStore(currentTool.name, currentTool));
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);

  store.updateTool(currentTool);

  const provider = providerForModel(snapshot.model);
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

  const providerOptions = useMemo(
    function computeProviderOptions() {
      return (
        snapshot.reasoningEffort &&
        MODEL_GROUPS.flatMap((g) => g.models).find((m) => m.value === snapshot.model)?.reasoning ===
          true
          ? getProviderOptions(provider, snapshot.model, snapshot.reasoningEffort)
          : undefined
      ) as ChatProviderOptions | undefined;
    },
    [provider, snapshot.model, snapshot.reasoningEffort],
  );

  const systemPrompt = useMemo(
    function computeSystemPrompt() {
      const serializedSchema = snapshot.schema ? JSON.stringify(snapshot.schema, null, 2) : "{}";
      const contextCommands = currentTool.commands.filter((command) =>
        contextSelection.commandKeys.includes(command.key),
      );
      const contextParameters = currentTool.parameters.filter((parameter) =>
        contextSelection.parameterKeys.includes(parameter.key),
      );
      return generatePrompt(serializedSchema, {
        context: {
          selectedCommands: contextCommands.map((command) => ({
            key: command.key,
            name: command.name,
          })),
          selectedParameters: contextParameters.map((parameter) => ({
            key: parameter.key,
            name: parameter.name,
            longFlag: parameter.longFlag,
            shortFlag: parameter.shortFlag,
          })),
        },
      });
    },
    [snapshot.schema, currentTool, contextSelection],
  );

  const agent = useMemo(
    function createAgent() {
      const aiModel = createModelInstance(provider, currentKeys.key ?? "", snapshot.model);

      const editToolDef = createEditTool(
        () => store.getPendingPreview() ?? store.getCurrentTool(),
        function onEditPreview(tool) {
          store.setPendingPreview(tool);
          onStreamingTool?.(tool);
        },
      );

      const applyToolDefinitionDef = createApplyToolDefinitionTool(
        () => {},
        function onApplyExecuted() {
          const preview = store.getPendingPreview();
          if (preview) {
            onApply(replaceKey(preview) as Tool);
            store.setPendingPreview(null);
          }
          onStreamingTool?.(null);
        },
      );

      const tools = {
        editTool: editToolDef,
        applyToolDefinition: applyToolDefinitionDef,
        readTool: createReadTool(() => store.getPendingPreview() ?? store.getCurrentTool()),
        ...(tavilyKeys.isSaved && tavilyKeys.key
          ? { tavilySearch: createTavilySearchTool(tavilyKeys.key) }
          : {}),
        ...(tavilyKeys.isSaved && tavilyKeys.key
          ? { tavilyExtract: createTavilyExtractTool(tavilyKeys.key) }
          : {}),
      };

      return createToolLoopAgent({
        model: aiModel,
        instructions: systemPrompt,
        tools,
        providerOptions,
        onFinish: function handleFinishUsage({ usage }) {
          store.setUsage(usage);
        },
      });
    },
    [
      provider,
      currentKeys.key,
      snapshot.model,
      systemPrompt,
      providerOptions,
      tavilyKeys.isSaved,
      tavilyKeys.key,
      store,
      onApply,
      onStreamingTool,
    ],
  );

  const transport = useMemo(
    function createTransport() {
      return new DirectChatTransport({ agent, sendReasoning: true });
    },
    [agent],
  );

  const chatInstance = useMemo(
    function createChatInstance() {
      return new Chat<AgentUIMessage>({
        id: snapshot.chatId,
        messages: store.getLastMessages(),
        transport,
        sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
        onFinish: function handleChatFinish() {
          onGeneratingChange?.(false);
        },
        onError: function handleChatError(error) {
          onGeneratingChange?.(false);
          onStreamingTool?.(null);
          if (error.name !== "AbortError") {
            toast.error(error.message || "AI request failed");
          }
        },
      });
    },
    [snapshot.chatId, transport, store, onGeneratingChange, onStreamingTool],
  );

  const chat = useChat({ chat: chatInstance });
  const rawMessages = chat.messages;
  const isStreaming = chat.status === "submitted" || chat.status === "streaming";

  store.syncApprovals(rawMessages);
  store.syncPersistence(rawMessages, isStreaming);
  store.syncGeneratingState(rawMessages, isStreaming, onGeneratingChange, onStreamingTool);

  const messages = useMemo(
    function computeMessages() {
      return rawMessages
        .filter((message) => message.role === "user" || message.role === "assistant")
        .map((message) => toChatMessage(message, snapshot.approvalArtifacts));
    },
    [rawMessages, snapshot.approvalArtifacts],
  );

  const pendingApproval = useMemo(
    function computePendingApproval() {
      return findPendingApproval(messages);
    },
    [messages],
  );

  const toolCallCount = useMemo(
    function computeToolCallCount() {
      return countCompletedToolCalls(rawMessages);
    },
    [rawMessages],
  );

  function sendMessage(textOverride?: string) {
    const userText = (textOverride ?? snapshot.input).trim();
    if (!userText || isStreaming || !snapshot.model) return;
    if (!currentKeys.key) {
      toast.error("API key not configured", {
        description: "Open settings to add your API key.",
      });
      return;
    }
    store.prepareForSend();
    if (!textOverride) {
      store.clearInput();
    }
    chat.sendMessage({ text: userText });
  }

  function resendFromIndex(index: number, newContent: string) {
    if (isStreaming || !newContent.trim() || !snapshot.model || !currentKeys.key) return;
    store.prepareForResend(onStreamingTool);
    chat.setMessages(rawMessages.slice(0, index));
    chat.sendMessage({ text: newContent });
  }

  function clearMessages() {
    store.flushAndReset(rawMessages, onStreamingTool, onGeneratingChange);
  }

  function confirmPatch() {
    if (!pendingApproval) return;
    chat.addToolApprovalResponse({
      id: pendingApproval.approvalId,
      approved: true,
      reason:
        "Applied successfully. Provide a concise summary of all the changes you made to the tool.",
    });
  }

  function rejectPatch() {
    if (!pendingApproval) return;
    chat.addToolApprovalResponse({
      id: pendingApproval.approvalId,
      approved: false,
      reason: "User rejected the changes",
    });
    store.setPendingPreview(null);
    onStreamingTool?.(null);
  }

  function loadSession(session: ChatWithPreview) {
    store.loadSession(session, onStreamingTool, onGeneratingChange);
  }

  return {
    messages,
    input: snapshot.input,
    setInput: store.setInput.bind(store),
    isStreaming,
    model: snapshot.model,
    setModel: store.setModel.bind(store),
    reasoningEffort: snapshot.reasoningEffort,
    setReasoningEffort: store.setReasoningEffort.bind(store),
    provider,
    sendMessage,
    stopStreaming: chat.stop,
    resendFromIndex,
    clearMessages,
    allProviderKeys,
    tavilyKeys,
    pendingApproval,
    confirmPatch,
    rejectPatch,
    usage: snapshot.usage,
    toolCallCount,
    recentSessions: snapshot.recentSessions,
    loadSession,
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
  pendingApproval: {
    approvalId: string;
    previewTool: Tool;
    originalTool: Tool;
    summary: string;
    messageIndex: number;
  } | null;
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
                            try {
                              return `Extracted from ${new URL(urls[0]).hostname}`;
                            } catch {
                              return "Extracted content";
                            }
                          })()
                        : "Extracting content…"
                      : tc.toolName === "readTool"
                        ? (() => {
                            const jsonPath = tc.input.jsonPath as string | undefined;
                            const summary = tc.input.summary as string | undefined;
                            const pathLabel =
                              jsonPath && jsonPath !== "$" ? jsonPath : "whole tool";
                            if (tc.state !== "output-available")
                              return summary
                                ? `${summary} (${pathLabel})`
                                : `Reading ${pathLabel}…`;
                            return summary ? `${summary} (${pathLabel})` : `Read ${pathLabel}`;
                          })()
                        : (tc.title ?? "Editing…")
                }
                status={tc.state === "output-available" ? "complete" : "active"}
              >
                {tc.toolName === "tavilySearch" && tc.state === "output-available" && (
                  <WebSearchResults
                    results={(tc.output as { results?: WebSearchResult[] })?.results ?? []}
                  />
                )}
                {tc.toolName === "tavilyExtract" && tc.state === "output-available" && (
                  <ExtractedContent
                    results={(tc.output as { results?: ExtractResult[] })?.results ?? []}
                  />
                )}
                {tc.toolName === "editTool" &&
                  tc.state === "output-available" &&
                  (() => {
                    const patch = tc.input.patch as Record<string, unknown> | undefined;
                    if (!patch) return null;
                    const keys = Object.keys(patch);
                    return (
                      <Collapsible>
                        <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
                          <ChevronRightIcon className="h-3 w-3 transition-transform in-data-[state=open]:rotate-90" />
                          {keys.length} field{keys.length !== 1 ? "s" : ""} modified
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <pre className="mt-1 max-h-48 overflow-auto rounded bg-muted p-2 text-xs">
                            {JSON.stringify(patch, null, 2)}
                          </pre>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })()}
              </ChainOfThoughtStep>
            ))}
          </ChainOfThoughtContent>
        </ChainOfThought>
      )}
      {applyToolCall && (
        <ToolCard
          className="w-full"
          defaultOpen
        >
          <ToolHeader
            type="tool-applyToolDefinition"
            state={applyToolCall.state}
          />
          <ToolContent>
            {applyToolCall.originalTool && applyToolCall.previewTool && (
              <DiffView
                original={applyToolCall.originalTool}
                updated={applyToolCall.previewTool}
              />
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
                  <p className="text-center text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    Recent sessions
                  </p>
                  <div className="flex flex-col gap-1">
                    {chat.recentSessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => chat.loadSession(session)}
                        className="flex w-full items-start justify-between gap-2 rounded border border-border/40 bg-muted/30 px-3 py-2 text-left text-xs transition-colors hover:border-border/60 hover:bg-muted/50"
                      >
                        <span className="line-clamp-1 flex-1 text-foreground">
                          {session.preview || "Empty session"}
                        </span>
                        <span className="shrink-0 text-muted-foreground">
                          {formatRelativeTime(session.updatedAt)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
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

      {chat.messages.length === 0 && (
        <div className="shrink-0 px-3 pb-2">
          <Suggestions className="w-full flex-wrap justify-center">
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
        </div>
      )}

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
