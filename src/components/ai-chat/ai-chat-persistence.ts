import type { UIMessage } from "ai";

export interface ChatSession<UI_MESSAGE extends UIMessage = UIMessage> {
  id: string;
  toolName: string;
  messages: UI_MESSAGE[];
  updatedAt: number;
  preview: string;
}

function openSessionsDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("commandly", 3);
    req.onupgradeneeded = (event) => {
      const db = req.result;
      const oldVersion = (event as IDBVersionChangeEvent).oldVersion;
      if (!db.objectStoreNames.contains("keys")) {
        db.createObjectStore("keys");
      }
      if (oldVersion < 3 && db.objectStoreNames.contains("sessions")) {
        db.deleteObjectStore("sessions");
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

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part): part is Extract<UIMessage["parts"][number], { type: "text" }> => part.type === "text")
    .map((part) => part.text)
    .join("");
}

function hasPersistableContent(message: UIMessage): boolean {
  return message.parts.some((part) => {
    if (part.type === "text" || part.type === "reasoning") {
      return part.text.trim().length > 0;
    }

    return part.type !== "step-start";
  });
}

function normalizeSession<UI_MESSAGE extends UIMessage>(session: ChatSession<UI_MESSAGE>): ChatSession<UI_MESSAGE> {
  return {
    id: session.id,
    toolName: session.toolName,
    messages: session.messages,
    updatedAt: session.updatedAt,
    preview: getSessionPreview(session.messages),
  };
}

function toStoredMessages<UI_MESSAGE extends UIMessage>(messages: UI_MESSAGE[]): UI_MESSAGE[] {
  return JSON.parse(JSON.stringify(messages)) as UI_MESSAGE[];
}

export function getSessionPreview(messages: UIMessage[]): string {
  const firstUserMessage = messages.find((message) => message.role === "user");
  return getMessageText(firstUserMessage ?? { id: "", role: "user", parts: [] }).slice(0, 80);
}

export function getPersistableMessages(messages: UIMessage[]): UIMessage[] {
  return messages.filter((message) => message.role !== "assistant" || hasPersistableContent(message));
}

export async function saveChatSession<UI_MESSAGE extends UIMessage>(session: ChatSession<UI_MESSAGE>): Promise<void> {
  const db = await openSessionsDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("sessions", "readwrite");
    tx.objectStore("sessions").put({
      ...session,
      messages: toStoredMessages(session.messages),
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadRecentSessions<UI_MESSAGE extends UIMessage>(
  toolName: string,
  limit = 5,
): Promise<Array<ChatSession<UI_MESSAGE>>> {
  const db = await openSessionsDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("sessions", "readonly");
    const index = tx.objectStore("sessions").index("toolName");
    const req = index.getAll(toolName);
    req.onsuccess = () => {
      const sessions = (req.result as Array<ChatSession<UI_MESSAGE>>)
        .map(normalizeSession)
        .sort((a, b) => b.updatedAt - a.updatedAt);
      resolve(sessions.slice(0, limit));
    };
    req.onerror = () => reject(req.error);
  });
}
