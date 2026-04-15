import "fake-indexeddb/auto";
import type { UIMessage } from "ai";
import {
  saveChatSession,
  loadRecentSessions,
  getPersistableMessages,
  getSessionPreview,
  type ChatSession,
} from "@/components/ai-chat/ai-chat-persistence";

// Persistence is type-agnostic (JSON serialization), so we cast complex
// SDK tool-invocation parts to avoid fighting deeply generic UIMessage types.
function makeToolPart(toolName: string, overrides: Record<string, unknown> = {}): UIMessage["parts"][number] {
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
  return {
    id: id ?? crypto.randomUUID(),
    role,
    parts: [{ type: "text", text }],
  };
}

function makeEmptyAssistantMessage(): UIMessage {
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    parts: [{ type: "step-start" }],
  };
}

function makeSession(overrides: Partial<ChatSession> = {}): ChatSession {
  return {
    id: crypto.randomUUID(),
    toolName: "test-tool",
    messages: [
      makeTextMessage("user", "Hello"),
      makeTextMessage("assistant", "Hi there"),
    ],
    updatedAt: Date.now(),
    preview: "Hello",
    ...overrides,
  };
}

beforeEach(() => {
  // Reset IndexedDB between tests to avoid cross-test contamination
  indexedDB = new IDBFactory();
});

describe("saveChatSession", () => {
  it("saves a session and retrieves it by toolName", async () => {
    const session = makeSession();

    await saveChatSession(session);
    const loaded = await loadRecentSessions(session.toolName);

    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe(session.id);
    expect(loaded[0].toolName).toBe(session.toolName);
    expect(loaded[0].messages).toHaveLength(2);
    expect(loaded[0].messages[0].parts[0]).toEqual({ type: "text", text: "Hello" });
  });

  it("overwrites a session with the same id", async () => {
    const session = makeSession();
    await saveChatSession(session);

    const updated: ChatSession = {
      ...session,
      messages: [
        makeTextMessage("user", "Updated message"),
        makeTextMessage("assistant", "Updated response"),
      ],
      updatedAt: Date.now() + 1000,
      preview: "Updated message",
    };
    await saveChatSession(updated);

    const loaded = await loadRecentSessions(session.toolName);
    expect(loaded).toHaveLength(1);
    expect(loaded[0].preview).toBe("Updated message");
  });

  it("stores messages as plain JSON-safe objects", async () => {
    const msg = makeTextMessage("user", "test");
    // Attach a non-serializable property to verify JSON roundtrip strips it
    (msg as unknown as Record<string, unknown>).fn = () => {};

    const session = makeSession({ messages: [msg] });
    await saveChatSession(session);

    const loaded = await loadRecentSessions(session.toolName);
    expect(loaded[0].messages[0]).not.toHaveProperty("fn");
  });
});

describe("loadRecentSessions", () => {
  it("returns empty array when no sessions exist", async () => {
    const loaded = await loadRecentSessions("nonexistent-tool");
    expect(loaded).toEqual([]);
  });

  it("filters sessions by toolName", async () => {
    await saveChatSession(makeSession({ toolName: "tool-a" }));
    await saveChatSession(makeSession({ toolName: "tool-b" }));
    await saveChatSession(makeSession({ toolName: "tool-a" }));

    const sessionsA = await loadRecentSessions("tool-a");
    const sessionsB = await loadRecentSessions("tool-b");

    expect(sessionsA).toHaveLength(2);
    expect(sessionsB).toHaveLength(1);
    expect(sessionsA.every((s) => s.toolName === "tool-a")).toBe(true);
  });

  it("returns sessions sorted by updatedAt descending", async () => {
    const now = Date.now();
    await saveChatSession(makeSession({ toolName: "t", updatedAt: now - 2000 }));
    await saveChatSession(makeSession({ toolName: "t", updatedAt: now }));
    await saveChatSession(makeSession({ toolName: "t", updatedAt: now - 1000 }));

    const loaded = await loadRecentSessions("t");
    expect(loaded[0].updatedAt).toBe(now);
    expect(loaded[1].updatedAt).toBe(now - 1000);
    expect(loaded[2].updatedAt).toBe(now - 2000);
  });

  it("respects the limit parameter", async () => {
    for (let i = 0; i < 10; i++) {
      await saveChatSession(makeSession({ toolName: "t", updatedAt: i }));
    }

    const loaded = await loadRecentSessions("t", 3);
    expect(loaded).toHaveLength(3);
  });

  it("defaults to a limit of 5", async () => {
    for (let i = 0; i < 8; i++) {
      await saveChatSession(makeSession({ toolName: "t", updatedAt: i }));
    }

    const loaded = await loadRecentSessions("t");
    expect(loaded).toHaveLength(5);
  });

  it("regenerates preview from messages on load", async () => {
    const session = makeSession({
      messages: [makeTextMessage("user", "My actual question")],
      preview: "stale-preview",
    });
    await saveChatSession(session);

    const loaded = await loadRecentSessions(session.toolName);
    expect(loaded[0].preview).toBe("My actual question");
  });
});

describe("getPersistableMessages", () => {
  it("keeps user messages regardless of content", () => {
    const messages: UIMessage[] = [
      makeTextMessage("user", "hello"),
      makeTextMessage("user", ""),
    ];
    expect(getPersistableMessages(messages)).toHaveLength(2);
  });

  it("filters out assistant messages that only have step-start parts", () => {
    const messages: UIMessage[] = [
      makeTextMessage("user", "hello"),
      makeEmptyAssistantMessage(),
      makeTextMessage("assistant", "response"),
    ];
    const result = getPersistableMessages(messages);
    expect(result).toHaveLength(2);
    expect(result[0].role).toBe("user");
    expect(result[1].role).toBe("assistant");
    expect(result[1].parts[0]).toEqual({ type: "text", text: "response" });
  });

  it("keeps assistant messages with text content", () => {
    const messages: UIMessage[] = [
      makeTextMessage("assistant", "I have content"),
    ];
    expect(getPersistableMessages(messages)).toHaveLength(1);
  });

  it("keeps assistant messages with tool-invocation parts", () => {
    const messages: UIMessage[] = [
      {
        id: "1",
        role: "assistant",
        parts: [
          { type: "step-start" },
          makeToolPart("editTool", { input: {}, output: "done" }),
        ],
      },
    ];
    expect(getPersistableMessages(messages)).toHaveLength(1);
  });

  it("filters assistant messages with only whitespace text", () => {
    const messages: UIMessage[] = [
      {
        id: "1",
        role: "assistant",
        parts: [{ type: "text", text: "   \n  " }],
      },
    ];
    expect(getPersistableMessages(messages)).toHaveLength(0);
  });
});

describe("getSessionPreview", () => {
  it("returns text from the first user message", () => {
    const messages: UIMessage[] = [
      makeTextMessage("assistant", "Welcome"),
      makeTextMessage("user", "My question here"),
    ];
    expect(getSessionPreview(messages)).toBe("My question here");
  });

  it("truncates to 80 characters", () => {
    const longText = "a".repeat(120);
    const messages: UIMessage[] = [makeTextMessage("user", longText)];
    expect(getSessionPreview(messages)).toHaveLength(80);
  });

  it("returns empty string when no user messages exist", () => {
    const messages: UIMessage[] = [makeTextMessage("assistant", "Hello")];
    expect(getSessionPreview(messages)).toBe("");
  });

  it("joins multiple text parts from the same message", () => {
    const messages: UIMessage[] = [
      {
        id: "1",
        role: "user",
        parts: [
          { type: "text", text: "Part one " },
          { type: "text", text: "Part two" },
        ],
      },
    ];
    expect(getSessionPreview(messages)).toBe("Part one Part two");
  });
});

describe("onFinish callback integration", () => {
  it("persists when onFinish fires with valid messages", async () => {
    const chatId = crypto.randomUUID();
    const toolName = "test-tool";
    const finishedMessages: UIMessage[] = [
      makeTextMessage("user", "Hello"),
      makeTextMessage("assistant", "Hi there!"),
    ];

    // Simulate the exact onFinish flow from ai-chat.tsx
    const persistableMessages = getPersistableMessages(finishedMessages);
    expect(persistableMessages.length).toBeGreaterThan(0);

    await saveChatSession({
      id: chatId,
      toolName,
      messages: persistableMessages,
      updatedAt: Date.now(),
      preview: getSessionPreview(persistableMessages),
    });

    const loaded = await loadRecentSessions(toolName);
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe(chatId);
    expect(loaded[0].messages).toHaveLength(2);
  });

  it("skips persistence when all assistant messages are empty step-starts", async () => {
    const finishedMessages: UIMessage[] = [
      makeTextMessage("user", "Hello"),
      makeEmptyAssistantMessage(),
    ];

    const persistableMessages = getPersistableMessages(finishedMessages);
    // User messages always persist, but empty assistant messages are filtered
    expect(persistableMessages).toHaveLength(1);
    expect(persistableMessages[0].role).toBe("user");
  });

  it("persists multi-turn conversations with tool calls", async () => {
    const chatId = crypto.randomUUID();
    const toolName = "test-tool";
    const finishedMessages: UIMessage[] = [
      makeTextMessage("user", "Edit the tool name"),
      {
        id: "a1",
        role: "assistant",
        parts: [
          { type: "step-start" },
          { type: "text", text: "I'll edit the tool name for you." },
          makeToolPart("editTool", {
            input: { field: "name", value: "newName" },
            output: { success: true },
          }),
        ],
      },
      {
        id: "a2",
        role: "assistant",
        parts: [
          { type: "step-start" },
          makeToolPart("applyToolDefinition", {
            input: {},
            output: { applied: true },
          }),
        ],
      },
      {
        id: "a3",
        role: "assistant",
        parts: [{ type: "text", text: "Done! I've updated the tool name." }],
      },
    ];

    const persistableMessages = getPersistableMessages(finishedMessages);
    expect(persistableMessages).toHaveLength(4);

    await saveChatSession({
      id: chatId,
      toolName,
      messages: persistableMessages,
      updatedAt: Date.now(),
      preview: getSessionPreview(persistableMessages),
    });

    const loaded = await loadRecentSessions(toolName);
    expect(loaded).toHaveLength(1);
    expect(loaded[0].messages).toHaveLength(4);
  });

  it("updates existing session on subsequent onFinish calls", async () => {
    const chatId = crypto.randomUUID();
    const toolName = "test-tool";

    // First onFinish — one exchange
    await saveChatSession({
      id: chatId,
      toolName,
      messages: [makeTextMessage("user", "First message"), makeTextMessage("assistant", "First reply")],
      updatedAt: Date.now(),
      preview: "First message",
    });

    // Second onFinish — conversation continued
    await saveChatSession({
      id: chatId,
      toolName,
      messages: [
        makeTextMessage("user", "First message"),
        makeTextMessage("assistant", "First reply"),
        makeTextMessage("user", "Second message"),
        makeTextMessage("assistant", "Second reply"),
      ],
      updatedAt: Date.now() + 1000,
      preview: "First message",
    });

    const loaded = await loadRecentSessions(toolName);
    expect(loaded).toHaveLength(1);
    expect(loaded[0].messages).toHaveLength(4);
  });
});

describe("round-trip message integrity", () => {
  it("preserves tool-invocation parts through save/load", async () => {
    const messages: UIMessage[] = [
      makeTextMessage("user", "edit the tool"),
      {
        id: "a1",
        role: "assistant",
        parts: [
          { type: "text", text: "I'll edit the tool." },
          makeToolPart("editTool", {
            input: { field: "name", value: "newName" },
            output: { success: true },
          }),
        ],
      },
    ];

    const session = makeSession({ messages });
    await saveChatSession(session);

    const loaded = await loadRecentSessions(session.toolName);
    const assistantMsg = loaded[0].messages.find((m) => m.role === "assistant")!;

    expect(assistantMsg.parts).toHaveLength(2);
    const toolPart = assistantMsg.parts[1] as Record<string, unknown>;
    expect(toolPart.type).toBe("tool-editTool");
    expect(toolPart.input).toEqual({ field: "name", value: "newName" });
    expect(toolPart.output).toEqual({ success: true });
  });

  it("preserves reasoning parts through save/load", async () => {
    const messages: UIMessage[] = [
      makeTextMessage("user", "think about this"),
      {
        id: "a1",
        role: "assistant",
        parts: [
          { type: "reasoning", text: "Let me think...", providerMetadata: {} },
          { type: "text", text: "Here's my answer" },
        ],
      },
    ];

    const session = makeSession({ messages });
    await saveChatSession(session);

    const loaded = await loadRecentSessions(session.toolName);
    const parts = loaded[0].messages[1].parts;
    expect(parts[0].type).toBe("reasoning");
    if (parts[0].type === "reasoning") {
      expect(parts[0].text).toBe("Let me think...");
    }
  });

  it("handles empty messages array", async () => {
    const session = makeSession({ messages: [] });
    await saveChatSession(session);

    const loaded = await loadRecentSessions(session.toolName);
    expect(loaded[0].messages).toEqual([]);
  });
});
