import {
  createChat,
  upsertMessage,
  loadChat,
  getChats,
  deleteChat,
  deleteMessage,
  getPersistableMessages,
  getSessionPreview,
} from "@/components/ai-chat/ai-chat-persistence";
import type { UIMessage } from "ai";

function makeToolPart(
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

beforeEach(() => {
  Object.defineProperty(globalThis, "indexedDB", {
    value: new IDBFactory(),
    writable: true,
    configurable: true,
  });
});

describe("createChat + loadChat", () => {
  it("creates a chat and loads its messages", async () => {
    const chatId = crypto.randomUUID();
    await createChat(chatId, "test-tool");

    const msg = makeTextMessage("user", "Hello");
    await upsertMessage(chatId, msg, 0);

    const loaded = await loadChat(chatId);
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe(msg.id);
    expect(loaded[0].parts[0]).toEqual({ type: "text", text: "Hello" });
  });

  it("returns empty array for chat with no messages", async () => {
    const chatId = crypto.randomUUID();
    await createChat(chatId, "test-tool");

    const loaded = await loadChat(chatId);
    expect(loaded).toEqual([]);
  });

  it("returns messages in order", async () => {
    const chatId = crypto.randomUUID();
    await createChat(chatId, "test-tool");

    const msg1 = makeTextMessage("user", "First");
    const msg2 = makeTextMessage("assistant", "Second");
    const msg3 = makeTextMessage("user", "Third");

    await upsertMessage(chatId, msg2, 1);
    await upsertMessage(chatId, msg3, 2);
    await upsertMessage(chatId, msg1, 0);

    const loaded = await loadChat(chatId);
    expect(loaded.map((m) => m.parts[0])).toEqual([
      { type: "text", text: "First" },
      { type: "text", text: "Second" },
      { type: "text", text: "Third" },
    ]);
  });
});

describe("upsertMessage", () => {
  it("updates an existing message on re-upsert", async () => {
    const chatId = crypto.randomUUID();
    await createChat(chatId, "test-tool");

    const msgId = crypto.randomUUID();
    const original = makeTextMessage("assistant", "Original", msgId);
    await upsertMessage(chatId, original, 0);

    const updated: UIMessage = {
      id: msgId,
      role: "assistant",
      parts: [{ type: "text", text: "Updated" }],
    };
    await upsertMessage(chatId, updated, 0);

    const loaded = await loadChat(chatId);
    expect(loaded).toHaveLength(1);
    expect(loaded[0].parts[0]).toEqual({ type: "text", text: "Updated" });
  });

  it("rejects upsert for nonexistent chat", async () => {
    const msg = makeTextMessage("user", "Hello");
    await expect(upsertMessage("nonexistent", msg, 0)).rejects.toThrow();
  });

  it("strips non-serializable properties from parts", async () => {
    const chatId = crypto.randomUUID();
    await createChat(chatId, "test-tool");

    const msg = makeTextMessage("user", "test");
    (msg as unknown as Record<string, unknown>).fn = () => {};

    await upsertMessage(chatId, msg, 0);
    const loaded = await loadChat(chatId);
    expect(loaded[0]).not.toHaveProperty("fn");
  });
});

describe("getChats", () => {
  it("returns empty array when no chats exist", async () => {
    const chats = await getChats("nonexistent-tool");
    expect(chats).toEqual([]);
  });

  it("filters chats by toolName", async () => {
    await createChat("a1", "tool-a");
    await createChat("b1", "tool-b");
    await createChat("a2", "tool-a");

    const chatsA = await getChats("tool-a");
    const chatsB = await getChats("tool-b");

    expect(chatsA).toHaveLength(2);
    expect(chatsB).toHaveLength(1);
    expect(chatsA.every((c) => c.toolName === "tool-a")).toBe(true);
  });

  it("respects the limit parameter", async () => {
    for (let i = 0; i < 10; i++) {
      await createChat(crypto.randomUUID(), "t");
    }
    const chats = await getChats("t", 3);
    expect(chats).toHaveLength(3);
  });

  it("defaults to a limit of 5", async () => {
    for (let i = 0; i < 8; i++) {
      await createChat(crypto.randomUUID(), "t");
    }
    const chats = await getChats("t");
    expect(chats).toHaveLength(5);
  });

  it("computes preview from first user message", async () => {
    const chatId = crypto.randomUUID();
    await createChat(chatId, "test-tool");
    await upsertMessage(chatId, makeTextMessage("assistant", "Welcome"), 0);
    await upsertMessage(chatId, makeTextMessage("user", "My question"), 1);

    const chats = await getChats("test-tool");
    expect(chats[0].preview).toBe("My question");
  });

  it("includes message count", async () => {
    const chatId = crypto.randomUUID();
    await createChat(chatId, "test-tool");
    await upsertMessage(chatId, makeTextMessage("user", "Hello"), 0);
    await upsertMessage(chatId, makeTextMessage("assistant", "Hi"), 1);

    const chats = await getChats("test-tool");
    expect(chats[0].messageCount).toBe(2);
  });
});

describe("deleteChat", () => {
  it("removes chat and all its messages", async () => {
    const chatId = crypto.randomUUID();
    await createChat(chatId, "test-tool");
    await upsertMessage(chatId, makeTextMessage("user", "Hello"), 0);
    await upsertMessage(chatId, makeTextMessage("assistant", "Hi"), 1);

    await deleteChat(chatId);

    const chats = await getChats("test-tool");
    expect(chats).toHaveLength(0);

    const messages = await loadChat(chatId);
    expect(messages).toHaveLength(0);
  });

  it("does not affect other chats", async () => {
    const chatA = crypto.randomUUID();
    const chatB = crypto.randomUUID();
    await createChat(chatA, "test-tool");
    await createChat(chatB, "test-tool");
    await upsertMessage(chatA, makeTextMessage("user", "A"), 0);
    await upsertMessage(chatB, makeTextMessage("user", "B"), 0);

    await deleteChat(chatA);

    const chats = await getChats("test-tool");
    expect(chats).toHaveLength(1);
    expect(chats[0].id).toBe(chatB);
  });
});

describe("deleteMessage", () => {
  it("deletes the target message and all subsequent messages", async () => {
    const chatId = crypto.randomUUID();
    await createChat(chatId, "test-tool");

    const m1 = makeTextMessage("user", "First");
    const m2 = makeTextMessage("assistant", "Second");
    const m3 = makeTextMessage("user", "Third");
    await upsertMessage(chatId, m1, 0);
    await upsertMessage(chatId, m2, 1);
    await upsertMessage(chatId, m3, 2);

    await deleteMessage(m2.id);

    const loaded = await loadChat(chatId);
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe(m1.id);
  });

  it("is a no-op for nonexistent message", async () => {
    await expect(deleteMessage("nonexistent")).resolves.toBeUndefined();
  });
});

describe("getPersistableMessages", () => {
  it("keeps user messages regardless of content", () => {
    const messages: UIMessage[] = [makeTextMessage("user", "hello"), makeTextMessage("user", "")];
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

  it("keeps assistant messages with tool-invocation parts", () => {
    const messages: UIMessage[] = [
      {
        id: "1",
        role: "assistant",
        parts: [{ type: "step-start" }, makeToolPart("editTool", { input: {}, output: "done" })],
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
});

describe("round-trip message integrity", () => {
  it("preserves tool-invocation parts through save/load", async () => {
    const chatId = crypto.randomUUID();
    await createChat(chatId, "test-tool");

    const assistantMsg: UIMessage = {
      id: "a1",
      role: "assistant",
      parts: [
        { type: "text", text: "I'll edit the tool." },
        makeToolPart("editTool", {
          input: { field: "name", value: "newName" },
          output: { success: true },
        }),
      ],
    };
    await upsertMessage(chatId, makeTextMessage("user", "edit the tool"), 0);
    await upsertMessage(chatId, assistantMsg, 1);

    const loaded = await loadChat(chatId);
    const loadedAssistant = loaded.find((m) => m.role === "assistant")!;

    expect(loadedAssistant.parts).toHaveLength(2);
    const toolPart = loadedAssistant.parts[1] as Record<string, unknown>;
    expect(toolPart.type).toBe("tool-editTool");
    expect(toolPart.input).toEqual({ field: "name", value: "newName" });
    expect(toolPart.output).toEqual({ success: true });
  });

  it("preserves reasoning parts through save/load", async () => {
    const chatId = crypto.randomUUID();
    await createChat(chatId, "test-tool");

    const assistantMsg: UIMessage = {
      id: "a1",
      role: "assistant",
      parts: [
        { type: "reasoning", text: "Let me think...", providerMetadata: {} },
        { type: "text", text: "Here's my answer" },
      ],
    };
    await upsertMessage(chatId, makeTextMessage("user", "think about this"), 0);
    await upsertMessage(chatId, assistantMsg, 1);

    const loaded = await loadChat(chatId);
    const parts = loaded[1].parts;
    expect(parts[0].type).toBe("reasoning");
    if (parts[0].type === "reasoning") {
      expect(parts[0].text).toBe("Let me think...");
    }
  });
});

describe("upsert updated messages (extraction regression)", () => {
  it("re-upserting a message with new parts preserves the update", async () => {
    const chatId = crypto.randomUUID();
    await createChat(chatId, "test-tool");

    const assistantId = "assistant-1";
    const initial: UIMessage = {
      id: assistantId,
      role: "assistant",
      parts: [
        { type: "text", text: "I'll extract content." },
        makeToolPart("tavilyExtract", {
          state: "input-available",
          input: { urls: ["https://example.com"] },
          output: undefined,
        }),
      ],
    };
    await upsertMessage(chatId, makeTextMessage("user", "extract example.com"), 0);
    await upsertMessage(chatId, initial, 1);

    const updated: UIMessage = {
      id: assistantId,
      role: "assistant",
      parts: [
        { type: "text", text: "I'll extract content." },
        makeToolPart("tavilyExtract", {
          state: "output-available",
          input: { urls: ["https://example.com"] },
          output: { results: [{ url: "https://example.com", raw_content: "page content" }] },
        }),
        { type: "text", text: "Here's what I found." },
      ],
    };
    await upsertMessage(chatId, updated, 1);

    const loaded = await loadChat(chatId);
    expect(loaded).toHaveLength(2);
    const loadedAssistant = loaded[1];
    expect(loadedAssistant.id).toBe(assistantId);
    expect(loadedAssistant.parts).toHaveLength(3);
    const toolPart = loadedAssistant.parts[1] as Record<string, unknown>;
    expect(toolPart.state).toBe("output-available");
    expect(toolPart.output).toEqual({
      results: [{ url: "https://example.com", raw_content: "page content" }],
    });
  });

  it("re-upserting preserves message order", async () => {
    const chatId = crypto.randomUUID();
    await createChat(chatId, "test-tool");

    const msg1 = makeTextMessage("user", "Hello");
    const msg2Id = "assistant-msg";
    const msg2Initial: UIMessage = {
      id: msg2Id,
      role: "assistant",
      parts: [{ type: "text", text: "thinking..." }],
    };
    await upsertMessage(chatId, msg1, 0);
    await upsertMessage(chatId, msg2Initial, 1);

    const msg2Updated: UIMessage = {
      id: msg2Id,
      role: "assistant",
      parts: [
        { type: "text", text: "thinking..." },
        makeToolPart("editTool", { input: { summary: "edit" }, output: { success: true } }),
        { type: "text", text: "Done editing." },
      ],
    };
    await upsertMessage(chatId, msg2Updated, 1);

    const msg3 = makeTextMessage("user", "Thanks");
    await upsertMessage(chatId, msg3, 2);

    const loaded = await loadChat(chatId);
    expect(loaded).toHaveLength(3);
    expect(loaded[0].id).toBe(msg1.id);
    expect(loaded[1].id).toBe(msg2Id);
    expect(loaded[1].parts).toHaveLength(3);
    expect(loaded[2].id).toBe(msg3.id);
  });

  it("persists extraction tool parts with chunked content", async () => {
    const chatId = crypto.randomUUID();
    await createChat(chatId, "test-tool");

    const msg: UIMessage = {
      id: "a1",
      role: "assistant",
      parts: [
        makeToolPart("tavilyExtract", {
          input: { urls: ["https://example.com"], startOffset: 0, maxChars: 6000 },
          output: {
            results: [
              {
                url: "https://example.com",
                raw_content: "x".repeat(6000),
                totalChars: 12000,
                hasMore: true,
                nextOffset: 6000,
              },
            ],
          },
        }),
        makeToolPart("tavilyExtract", {
          input: { urls: ["https://example.com"], startOffset: 6000, maxChars: 6000 },
          output: {
            results: [
              {
                url: "https://example.com",
                raw_content: "y".repeat(6000),
                totalChars: 12000,
                hasMore: false,
                nextOffset: 12000,
              },
            ],
          },
        }),
        { type: "text", text: "Extracted all content." },
      ],
    };

    await upsertMessage(chatId, makeTextMessage("user", "extract it all"), 0);
    await upsertMessage(chatId, msg, 1);

    const loaded = await loadChat(chatId);
    const assistant = loaded[1];
    expect(assistant.parts).toHaveLength(3);

    const firstExtract = assistant.parts[0] as Record<string, unknown>;
    const output1 = firstExtract.output as Record<string, unknown>;
    const results1 = output1.results as { hasMore: boolean }[];
    expect(results1[0].hasMore).toBe(true);

    const secondExtract = assistant.parts[1] as Record<string, unknown>;
    const output2 = secondExtract.output as Record<string, unknown>;
    const results2 = output2.results as { hasMore: boolean }[];
    expect(results2[0].hasMore).toBe(false);
  });
});

describe("hasPersistableContent with tool messages", () => {
  it("keeps assistant messages with extraction tool parts", () => {
    const messages: UIMessage[] = [
      {
        id: "1",
        role: "assistant",
        parts: [
          { type: "step-start" },
          makeToolPart("tavilyExtract", {
            input: { urls: ["https://example.com"] },
            output: { results: [] },
          }),
        ],
      },
    ];
    expect(getPersistableMessages(messages)).toHaveLength(1);
  });

  it("keeps assistant messages with search tool parts", () => {
    const messages: UIMessage[] = [
      {
        id: "1",
        role: "assistant",
        parts: [
          { type: "step-start" },
          makeToolPart("tavilySearch", {
            input: { query: "test" },
            output: { results: [] },
          }),
        ],
      },
    ];
    expect(getPersistableMessages(messages)).toHaveLength(1);
  });
});
