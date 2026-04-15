import { Tool } from "@/components/commandly/types/flat";
import { getToolName, isReasoningUIPart, isTextUIPart, isToolUIPart, type UIMessage } from "ai";

export interface ToolCallEntry {
  toolCallId: string;
  toolName: string;
  approvalId?: string;
  title: string;
  input: Record<string, unknown>;
  state:
    | "input-streaming"
    | "input-available"
    | "approval-requested"
    | "approval-responded"
    | "output-available"
    | "output-denied"
    | "output-error";
  output?: unknown;
  errorText?: string;
  originalTool?: Tool;
  previewTool?: Tool;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolApplied?: boolean;
  toolCalls?: ToolCallEntry[];
  isEditing?: boolean;
  editingContent?: string;
  reasoningContent?: string;
}

export interface ApprovalArtifact {
  approvalId: string;
  previewTool: Tool;
  originalTool: Tool;
  summary: string;
}

function getToolTitle(toolName: string, input: Record<string, unknown>, fallbackTitle?: string) {
  if (fallbackTitle) {
    return fallbackTitle;
  }

  if (toolName === "editTool") {
    return typeof input.summary === "string" ? input.summary : "Editing…";
  }

  if (toolName === "readTool") {
    const summary = input.summary as string | undefined;
    const jsonPath = input.jsonPath as string | undefined;
    const pathLabel = jsonPath && jsonPath !== "$" ? jsonPath : "whole tool";
    return summary ? `${summary} (${pathLabel})` : `Reading ${pathLabel}…`;
  }

  if (toolName === "applyToolDefinition") {
    return "Preparing to apply";
  }

  if (toolName === "tavilySearch") {
    return "Web Search";
  }

  if (toolName === "tavilyExtract") {
    return "Extract Content";
  }

  return toolName;
}

function toToolInput(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function toChatMessage(
  message: UIMessage,
  approvalArtifacts: Record<string, ApprovalArtifact>,
): ChatMessage {
  const content = message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join("");

  const reasoningContent = message.parts
    .filter(isReasoningUIPart)
    .map((part) => part.text)
    .join("");

  const toolCalls = message.parts.filter(isToolUIPart).map((part) => {
    const toolName = getToolName(part);
    const input = toToolInput("input" in part ? part.input : undefined);
    const approvalId = part.approval?.id;
    const artifact = approvalId ? approvalArtifacts[approvalId] : undefined;

    return {
      toolCallId: part.toolCallId,
      toolName,
      approvalId,
      title: getToolTitle(toolName, input, part.title),
      input,
      state: part.state,
      output: "output" in part ? part.output : undefined,
      errorText: "errorText" in part ? part.errorText : undefined,
      originalTool: artifact?.originalTool,
      previewTool: artifact?.previewTool,
    } satisfies ToolCallEntry;
  });

  return {
    id: message.id,
    role: message.role === "assistant" ? "assistant" : "user",
    content,
    toolApplied: toolCalls.some(
      (toolCall) =>
        toolCall.toolName === "applyToolDefinition" && toolCall.state === "output-available",
    ),
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    reasoningContent: reasoningContent || undefined,
  };
}

export function countCompletedToolCalls(messages: UIMessage[]): number {
  return messages.reduce(
    (count, message) =>
      count +
      message.parts.filter(
        (part) =>
          isToolUIPart(part) &&
          (part.state === "output-available" ||
            part.state === "output-error" ||
            part.state === "output-denied"),
      ).length,
    0,
  );
}

export function findPendingApproval(messages: ChatMessage[]) {
  for (let index = messages.length - 1; index >= 0; index--) {
    const applyToolCall = messages[index].toolCalls?.find(
      (toolCall) =>
        toolCall.toolName === "applyToolDefinition" &&
        toolCall.state === "approval-requested" &&
        toolCall.approvalId,
    );

    if (applyToolCall?.approvalId && applyToolCall.originalTool && applyToolCall.previewTool) {
      return {
        approvalId: applyToolCall.approvalId,
        previewTool: applyToolCall.previewTool,
        originalTool: applyToolCall.originalTool,
        summary:
          typeof applyToolCall.input.summary === "string"
            ? applyToolCall.input.summary
            : "Apply AI changes",
        messageIndex: index,
      };
    }
  }

  return null;
}
