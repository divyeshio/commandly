import type { ApprovalArtifact } from "../ai-chat/ai-chat-message-mapping";
import {
  type ChatWithPreview,
  createChat,
  getChats,
  getPersistableMessages,
  loadChat,
  truncateMessages,
  upsertMessage,
} from "../ai-chat/ai-chat-persistence";
import { MODEL_GROUPS, type ReasoningEffort } from "../ai-chat/model-picker";
import type { Tool } from "@/components/commandly/types/flat";
import type { LanguageModelUsage, UIMessage } from "ai";
import { isToolUIPart, getToolName, type InferUITools, type Tool as AISDKTool } from "ai";

type AgentUIMessage = UIMessage<unknown, never, InferUITools<Record<string, AISDKTool>>>;

export interface ChatStoreSnapshot {
  chatId: string;
  input: string;
  model: string;
  reasoningEffort: ReasoningEffort | null;
  schema: object | null;
  usage: LanguageModelUsage | null;
  recentSessions: ChatWithPreview[];
  approvalArtifacts: Record<string, ApprovalArtifact>;
  pendingPreview: Tool | null;
  lastMessages: AgentUIMessage[];
}

export class ChatStore {
  private toolName: string;
  private currentTool: Tool;
  private chatId: string;
  private input: string;
  private model: string;
  private reasoningEffort: ReasoningEffort | null;
  private schema: object | null = null;
  private usage: LanguageModelUsage | null = null;
  private recentSessions: ChatWithPreview[] = [];
  private approvalArtifacts: Record<string, ApprovalArtifact> = {};
  private pendingPreview: Tool | null = null;
  private lastMessages: AgentUIMessage[] = [];

  private persistedIds: string[] = [];
  private persistTimer: ReturnType<typeof setTimeout> | null = null;
  private prevGenerating = false;
  private prevStreamingCleared = true;

  private listeners = new Set<() => void>();
  private snapshot: ChatStoreSnapshot;

  constructor(toolName: string, currentTool: Tool) {
    this.toolName = toolName;
    this.currentTool = currentTool;
    this.chatId = crypto.randomUUID();
    this.input = "";
    this.model = localStorage.getItem("ai-model") ?? MODEL_GROUPS[0].models[0].value;
    this.reasoningEffort = localStorage.getItem("ai-reasoning-effort") as ReasoningEffort | null;
    this.snapshot = this.buildSnapshot();
    this.fetchSchema();
    this.refreshChats();
  }

  private buildSnapshot(): ChatStoreSnapshot {
    return {
      chatId: this.chatId,
      input: this.input,
      model: this.model,
      reasoningEffort: this.reasoningEffort,
      schema: this.schema,
      usage: this.usage,
      recentSessions: this.recentSessions,
      approvalArtifacts: this.approvalArtifacts,
      pendingPreview: this.pendingPreview,
      lastMessages: this.lastMessages,
    };
  }

  private notify(): void {
    this.snapshot = this.buildSnapshot();
    for (const listener of this.listeners) {
      listener();
    }
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): ChatStoreSnapshot => {
    return this.snapshot;
  };

  updateTool(tool: Tool): void {
    this.currentTool = tool;
    if (tool.binaryName !== this.toolName) {
      this.toolName = tool.binaryName;
      this.refreshChats();
    }
  }

  getChatId(): string {
    return this.chatId;
  }

  getLastMessages(): AgentUIMessage[] {
    return this.lastMessages;
  }

  getPendingPreview(): Tool | null {
    return this.pendingPreview;
  }

  getCurrentTool(): Tool {
    return this.currentTool;
  }

  setPendingPreview(tool: Tool | null): void {
    this.pendingPreview = tool;
  }

  setInput(value: string): void {
    this.input = value;
    this.notify();
  }

  setModel(value: string): void {
    this.model = value;
    localStorage.setItem("ai-model", value);
    const isReasoning =
      MODEL_GROUPS.flatMap((g) => g.models).find((m) => m.value === value)?.reasoning === true;
    if (!isReasoning) {
      this.reasoningEffort = null;
      localStorage.removeItem("ai-reasoning-effort");
    }
    this.notify();
  }

  setReasoningEffort(effort: ReasoningEffort | null): void {
    this.reasoningEffort = effort;
    if (effort === null) {
      localStorage.removeItem("ai-reasoning-effort");
    } else {
      localStorage.setItem("ai-reasoning-effort", effort);
    }
    this.notify();
  }

  setUsage(usage: LanguageModelUsage | null): void {
    this.usage = usage;
    this.notify();
  }

  private fetchSchema(): void {
    fetch("/specification/flat.json")
      .then((r) => r.json())
      .then((data: object) => {
        this.schema = data;
        this.notify();
      })
      .catch(() => {});
  }

  refreshChats(): void {
    getChats(this.toolName)
      .then((sessions) => {
        this.recentSessions = sessions;
        this.notify();
      })
      .catch(console.error);
  }

  syncApprovals(rawMessages: UIMessage[]): void {
    let changed = false;
    const next = { ...this.approvalArtifacts };

    for (const message of rawMessages) {
      for (const part of message.parts) {
        if (!isToolUIPart(part) || getToolName(part) !== "applyToolDefinition") {
          continue;
        }
        const approvalId = part.approval?.id;
        if (!approvalId || next[approvalId]) {
          continue;
        }
        next[approvalId] = {
          approvalId,
          previewTool: structuredClone(this.pendingPreview ?? this.currentTool),
          originalTool: structuredClone(this.currentTool),
          summary:
            typeof part.input === "object" &&
            part.input &&
            "summary" in part.input &&
            typeof part.input.summary === "string"
              ? part.input.summary
              : "Apply AI changes",
        };
        changed = true;
      }
    }

    if (changed) {
      this.approvalArtifacts = next;
      this.notify();
    }
  }

  syncPersistence(rawMessages: UIMessage[], isStreaming: boolean): void {
    const persistableMessages = getPersistableMessages(rawMessages);
    if (persistableMessages.length === 0) return;

    const currentChatId = this.chatId;
    const toolName = this.toolName;
    const snapshotIds = this.persistedIds.slice();

    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
    }

    const delay = isStreaming ? 2000 : 0;

    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;

      let divergeAt = snapshotIds.length;
      for (let i = 0; i < Math.min(snapshotIds.length, persistableMessages.length); i++) {
        if (snapshotIds[i] !== persistableMessages[i].id) {
          divergeAt = i;
          break;
        }
      }
      if (persistableMessages.length < divergeAt) {
        divergeAt = persistableMessages.length;
      }

      const upsertFrom =
        snapshotIds.length > 0 && divergeAt === snapshotIds.length && divergeAt > 0
          ? divergeAt - 1
          : divergeAt;
      const needsTruncate = divergeAt < snapshotIds.length;
      const hasUpdates = upsertFrom < persistableMessages.length;

      if (!hasUpdates && !needsTruncate) return;

      const isNewChat = snapshotIds.length === 0;
      const ensureChat = isNewChat ? createChat(currentChatId, toolName) : Promise.resolve();

      ensureChat
        .then(async () => {
          if (needsTruncate) {
            await truncateMessages(currentChatId, divergeAt);
          }
          for (let i = upsertFrom; i < persistableMessages.length; i++) {
            await upsertMessage(currentChatId, persistableMessages[i], i);
          }
          this.persistedIds = persistableMessages.map((m) => m.id);
        })
        .then(() => {
          if (isNewChat) this.refreshChats();
        })
        .catch(console.error);
    }, delay);
  }

  syncGeneratingState(
    rawMessages: UIMessage[],
    isStreaming: boolean,
    onGeneratingChange?: (isGenerating: boolean) => void,
    onStreamingTool?: (tool: Tool | null) => void,
  ): void {
    const hasPendingApproval = rawMessages.some((message) =>
      message.parts.some(
        (part) =>
          isToolUIPart(part) &&
          getToolName(part) === "applyToolDefinition" &&
          part.state === "approval-requested",
      ),
    );

    const isApplying = rawMessages.some((message) =>
      message.parts.some(
        (part) =>
          isToolUIPart(part) &&
          getToolName(part) === "applyToolDefinition" &&
          (part.state === "input-available" || part.state === "approval-responded"),
      ),
    );

    const generating = isStreaming && isApplying;
    if (generating !== this.prevGenerating) {
      this.prevGenerating = generating;
      onGeneratingChange?.(generating);
    }

    const shouldClear = !hasPendingApproval && !isApplying && !isStreaming;
    if (shouldClear && !this.prevStreamingCleared) {
      this.prevStreamingCleared = true;
      this.pendingPreview = null;
      onStreamingTool?.(null);
    } else if (!shouldClear) {
      this.prevStreamingCleared = false;
    }
  }

  prepareForSend(): void {
    this.pendingPreview = null;
    this.approvalArtifacts = {};
    this.notify();
  }

  prepareForResend(onStreamingTool?: (tool: Tool | null) => void): void {
    this.pendingPreview = null;
    this.approvalArtifacts = {};
    onStreamingTool?.(null);
    this.notify();
  }

  clearInput(): void {
    this.input = "";
    this.notify();
  }

  reset(
    onStreamingTool?: (tool: Tool | null) => void,
    onGeneratingChange?: (isGenerating: boolean) => void,
  ): void {
    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }
    this.lastMessages = [];
    this.persistedIds = [];
    this.prevGenerating = false;
    this.prevStreamingCleared = true;
    this.chatId = crypto.randomUUID();
    this.input = "";
    this.usage = null;
    this.approvalArtifacts = {};
    this.pendingPreview = null;
    onStreamingTool?.(null);
    onGeneratingChange?.(false);
    this.notify();
  }

  flushAndReset(
    rawMessages: UIMessage[],
    onStreamingTool?: (tool: Tool | null) => void,
    onGeneratingChange?: (isGenerating: boolean) => void,
  ): void {
    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }

    const persistableMessages = getPersistableMessages(rawMessages);
    if (persistableMessages.length === 0) {
      this.reset(onStreamingTool, onGeneratingChange);
      return;
    }

    const currentChatId = this.chatId;
    const toolName = this.toolName;
    const snapshotIds = this.persistedIds.slice();

    let divergeAt = snapshotIds.length;
    for (let i = 0; i < Math.min(snapshotIds.length, persistableMessages.length); i++) {
      if (snapshotIds[i] !== persistableMessages[i].id) {
        divergeAt = i;
        break;
      }
    }
    if (persistableMessages.length < divergeAt) {
      divergeAt = persistableMessages.length;
    }

    const upsertFrom =
      snapshotIds.length > 0 && divergeAt === snapshotIds.length && divergeAt > 0
        ? divergeAt - 1
        : divergeAt;
    const needsTruncate = divergeAt < snapshotIds.length;

    const ensureChat =
      snapshotIds.length === 0 ? createChat(currentChatId, toolName) : Promise.resolve();

    ensureChat
      .then(async () => {
        if (needsTruncate) {
          await truncateMessages(currentChatId, divergeAt);
        }
        for (let i = upsertFrom; i < persistableMessages.length; i++) {
          await upsertMessage(currentChatId, persistableMessages[i], i);
        }
      })
      .then(() => this.refreshChats())
      .catch(console.error)
      .finally(() => this.reset(onStreamingTool, onGeneratingChange));
  }

  loadSession(
    session: ChatWithPreview,
    onStreamingTool?: (tool: Tool | null) => void,
    onGeneratingChange?: (isGenerating: boolean) => void,
  ): void {
    loadChat<AgentUIMessage>(session.id)
      .then((messages) => {
        this.lastMessages = messages;
        this.persistedIds = messages.map((m) => m.id);
        this.chatId = session.id;
        this.usage = null;
        this.input = "";
        this.approvalArtifacts = {};
        this.pendingPreview = null;
        onStreamingTool?.(null);
        onGeneratingChange?.(false);
        this.notify();
      })
      .catch(console.error);
  }
}
