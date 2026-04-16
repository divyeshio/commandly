import {
  toChatMessage,
  countCompletedToolCalls,
  findPendingApproval,
  type ApprovalArtifact,
  type ChatMessage,
} from "@/components/ai-chat/ai-chat-message-mapping";
import type { Tool } from "@/components/commandly/types/flat";
import type { UIMessage } from "ai";

function makeToolUIPart(
  toolName: string,
  overrides: Record<string, unknown> = {},
): UIMessage["parts"][number] {
  return {
    type: `tool-${toolName}`,
    toolCallId: crypto.randomUUID(),
    state: "output-available",
    input: {},
    output: {},
    ...overrides,
  } as unknown as UIMessage["parts"][number];
}

function makeTextMessage(role: "user" | "assistant", text: string, id?: string): UIMessage {
  return { id: id ?? crypto.randomUUID(), role, parts: [{ type: "text", text }] };
}

function makeTool(name: string): Tool {
  return {
    key: crypto.randomUUID(),
    binaryName: name,
    displayName: name,
    description: "",
    version: "1.0.0",
    info: { website: "", repository: "", author: "" },
    commands: [],
    parameters: [],
  } as unknown as Tool;
}

describe("toChatMessage", () => {
  it("maps a user message correctly", () => {
    const msg = makeTextMessage("user", "Hello world");
    const result = toChatMessage(msg, {});
    expect(result.role).toBe("user");
    expect(result.content).toBe("Hello world");
    expect(result.toolCalls).toBeUndefined();
  });

  it("maps an assistant message with text", () => {
    const msg = makeTextMessage("assistant", "Here is the answer");
    const result = toChatMessage(msg, {});
    expect(result.role).toBe("assistant");
    expect(result.content).toBe("Here is the answer");
  });

  it("maps extraction tool call with output", () => {
    const msg: UIMessage = {
      id: "a1",
      role: "assistant",
      parts: [
        { type: "text", text: "Let me extract." },
        makeToolUIPart("tavilyExtract", {
          state: "output-available",
          input: { urls: ["https://example.com"] },
          output: {
            results: [{ url: "https://example.com", raw_content: "content here" }],
          },
        }),
        { type: "text", text: "Here's what I found." },
      ],
    };
    const result = toChatMessage(msg, {});
    expect(result.content).toBe("Let me extract.Here's what I found.");
    expect(result.toolCalls).toHaveLength(1);
    expect(result.toolCalls![0].toolName).toBe("tavilyExtract");
    expect(result.toolCalls![0].state).toBe("output-available");
    expect(result.toolCalls![0].output).toEqual({
      results: [{ url: "https://example.com", raw_content: "content here" }],
    });
  });

  it("maps extraction tool call in input-available state", () => {
    const msg: UIMessage = {
      id: "a1",
      role: "assistant",
      parts: [
        makeToolUIPart("tavilyExtract", {
          state: "input-available",
          input: { urls: ["https://example.com"] },
        }),
      ],
    };
    const result = toChatMessage(msg, {});
    expect(result.toolCalls).toHaveLength(1);
    expect(result.toolCalls![0].state).toBe("input-available");
    expect(result.toolCalls![0].title).toBe("Extract Content");
  });

  it("maps search tool call with query", () => {
    const msg: UIMessage = {
      id: "a1",
      role: "assistant",
      parts: [
        makeToolUIPart("tavilySearch", {
          state: "output-available",
          input: { query: "httpx docs" },
          output: { results: [{ title: "httpx", url: "https://httpx.io", content: "..." }] },
        }),
      ],
    };
    const result = toChatMessage(msg, {});
    expect(result.toolCalls![0].toolName).toBe("tavilySearch");
    expect(result.toolCalls![0].title).toBe("Web Search");
  });

  it("maps applyToolDefinition with approval artifacts", () => {
    const approvalId = "approval-1";
    const previewTool = makeTool("updated-tool");
    const originalTool = makeTool("original-tool");
    const artifacts: Record<string, ApprovalArtifact> = {
      [approvalId]: { approvalId, previewTool, originalTool, summary: "Update tool" },
    };

    const msg: UIMessage = {
      id: "a1",
      role: "assistant",
      parts: [
        makeToolUIPart("applyToolDefinition", {
          state: "approval-requested",
          input: { summary: "Update tool" },
          approval: { id: approvalId },
        }),
      ],
    };
    const result = toChatMessage(msg, artifacts);
    expect(result.toolCalls).toHaveLength(1);
    expect(result.toolCalls![0].previewTool).toBe(previewTool);
    expect(result.toolCalls![0].originalTool).toBe(originalTool);
  });

  it("marks toolApplied when applyToolDefinition has output-available state", () => {
    const msg: UIMessage = {
      id: "a1",
      role: "assistant",
      parts: [
        makeToolUIPart("applyToolDefinition", {
          state: "output-available",
          input: { summary: "Applied" },
          output: { success: true },
        }),
      ],
    };
    const result = toChatMessage(msg, {});
    expect(result.toolApplied).toBe(true);
  });

  it("does not mark toolApplied for non-apply tools", () => {
    const msg: UIMessage = {
      id: "a1",
      role: "assistant",
      parts: [
        makeToolUIPart("editTool", {
          state: "output-available",
          input: { summary: "edit" },
          output: { success: true },
        }),
      ],
    };
    const result = toChatMessage(msg, {});
    expect(result.toolApplied).toBe(false);
  });

  it("maps reasoning content", () => {
    const msg: UIMessage = {
      id: "a1",
      role: "assistant",
      parts: [
        { type: "reasoning", text: "thinking...", providerMetadata: {} },
        { type: "text", text: "answer" },
      ],
    };
    const result = toChatMessage(msg, {});
    expect(result.reasoningContent).toBe("thinking...");
    expect(result.content).toBe("answer");
  });

  it("maps message with extraction followed by edit followed by apply", () => {
    const approvalId = "ap-1";
    const artifacts: Record<string, ApprovalArtifact> = {
      [approvalId]: {
        approvalId,
        previewTool: makeTool("preview"),
        originalTool: makeTool("original"),
        summary: "Apply changes",
      },
    };

    const msg: UIMessage = {
      id: "a1",
      role: "assistant",
      parts: [
        makeToolUIPart("tavilyExtract", {
          state: "output-available",
          input: { urls: ["https://docs.example.com"] },
          output: { results: [{ url: "https://docs.example.com", raw_content: "docs" }] },
        }),
        makeToolUIPart("editTool", {
          state: "output-available",
          input: { summary: "Update from docs", patch: { description: "new desc" } },
          output: { success: true },
        }),
        makeToolUIPart("applyToolDefinition", {
          state: "approval-requested",
          input: { summary: "Apply changes" },
          approval: { id: approvalId },
        }),
        { type: "text", text: "I've updated the tool based on the docs." },
      ],
    };

    const result = toChatMessage(msg, artifacts);
    expect(result.toolCalls).toHaveLength(3);
    expect(result.toolCalls![0].toolName).toBe("tavilyExtract");
    expect(result.toolCalls![1].toolName).toBe("editTool");
    expect(result.toolCalls![2].toolName).toBe("applyToolDefinition");
    expect(result.toolCalls![2].previewTool!.binaryName).toBe("preview");
    expect(result.content).toBe("I've updated the tool based on the docs.");
  });
});

describe("countCompletedToolCalls", () => {
  it("returns 0 for empty messages", () => {
    expect(countCompletedToolCalls([])).toBe(0);
  });

  it("counts output-available tool calls", () => {
    const messages: UIMessage[] = [
      {
        id: "a1",
        role: "assistant",
        parts: [
          makeToolUIPart("editTool", { state: "output-available" }),
          makeToolUIPart("readTool", { state: "output-available" }),
        ],
      },
    ];
    expect(countCompletedToolCalls(messages)).toBe(2);
  });

  it("counts output-error and output-denied", () => {
    const messages: UIMessage[] = [
      {
        id: "a1",
        role: "assistant",
        parts: [
          makeToolUIPart("editTool", { state: "output-error" }),
          makeToolUIPart("applyToolDefinition", { state: "output-denied" }),
        ],
      },
    ];
    expect(countCompletedToolCalls(messages)).toBe(2);
  });

  it("does not count input-available or approval-requested", () => {
    const messages: UIMessage[] = [
      {
        id: "a1",
        role: "assistant",
        parts: [
          makeToolUIPart("editTool", { state: "input-available" }),
          makeToolUIPart("applyToolDefinition", { state: "approval-requested" }),
        ],
      },
    ];
    expect(countCompletedToolCalls(messages)).toBe(0);
  });

  it("counts across multiple messages including extraction", () => {
    const messages: UIMessage[] = [
      {
        id: "a1",
        role: "assistant",
        parts: [
          makeToolUIPart("tavilyExtract", { state: "output-available" }),
          makeToolUIPart("editTool", { state: "output-available" }),
        ],
      },
      {
        id: "a2",
        role: "assistant",
        parts: [makeToolUIPart("applyToolDefinition", { state: "output-available" })],
      },
    ];
    expect(countCompletedToolCalls(messages)).toBe(3);
  });
});

describe("findPendingApproval", () => {
  it("returns null when no approval is pending", () => {
    const messages: ChatMessage[] = [
      { id: "1", role: "user", content: "hello" },
      { id: "2", role: "assistant", content: "hi" },
    ];
    expect(findPendingApproval(messages)).toBeNull();
  });

  it("finds pending approval in the last message", () => {
    const previewTool = makeTool("preview");
    const originalTool = makeTool("original");
    const messages: ChatMessage[] = [
      { id: "1", role: "user", content: "edit this" },
      {
        id: "2",
        role: "assistant",
        content: "",
        toolCalls: [
          {
            toolCallId: "tc1",
            toolName: "applyToolDefinition",
            approvalId: "ap-1",
            title: "Preparing to apply",
            input: { summary: "Apply" },
            state: "approval-requested",
            previewTool,
            originalTool,
          },
        ],
      },
    ];
    const result = findPendingApproval(messages);
    expect(result).not.toBeNull();
    expect(result!.approvalId).toBe("ap-1");
    expect(result!.previewTool).toBe(previewTool);
    expect(result!.originalTool).toBe(originalTool);
    expect(result!.messageIndex).toBe(1);
  });

  it("returns null when approval is missing previewTool or originalTool", () => {
    const messages: ChatMessage[] = [
      {
        id: "1",
        role: "assistant",
        content: "",
        toolCalls: [
          {
            toolCallId: "tc1",
            toolName: "applyToolDefinition",
            approvalId: "ap-1",
            title: "Preparing to apply",
            input: { summary: "Apply" },
            state: "approval-requested",
          },
        ],
      },
    ];
    expect(findPendingApproval(messages)).toBeNull();
  });

  it("ignores non-approval-requested states", () => {
    const messages: ChatMessage[] = [
      {
        id: "1",
        role: "assistant",
        content: "",
        toolCalls: [
          {
            toolCallId: "tc1",
            toolName: "applyToolDefinition",
            approvalId: "ap-1",
            title: "Applied",
            input: { summary: "Apply" },
            state: "output-available",
            previewTool: makeTool("p"),
            originalTool: makeTool("o"),
          },
        ],
      },
    ];
    expect(findPendingApproval(messages)).toBeNull();
  });

  it("finds approval after extraction + edit chain", () => {
    const previewTool = makeTool("preview");
    const originalTool = makeTool("original");
    const messages: ChatMessage[] = [
      { id: "1", role: "user", content: "update from docs" },
      {
        id: "2",
        role: "assistant",
        content: "I've updated the tool.",
        toolCalls: [
          {
            toolCallId: "tc1",
            toolName: "tavilyExtract",
            title: "Extract Content",
            input: { urls: ["https://docs.example.com"] },
            state: "output-available",
            output: { results: [{ url: "https://docs.example.com", raw_content: "docs" }] },
          },
          {
            toolCallId: "tc2",
            toolName: "editTool",
            title: "Update description",
            input: { summary: "Update description", patch: {} },
            state: "output-available",
            output: { success: true },
          },
          {
            toolCallId: "tc3",
            toolName: "applyToolDefinition",
            approvalId: "ap-1",
            title: "Preparing to apply",
            input: { summary: "Apply doc updates" },
            state: "approval-requested",
            previewTool,
            originalTool,
          },
        ],
      },
    ];
    const result = findPendingApproval(messages);
    expect(result).not.toBeNull();
    expect(result!.approvalId).toBe("ap-1");
    expect(result!.summary).toBe("Apply doc updates");
    expect(result!.messageIndex).toBe(1);
  });
});
