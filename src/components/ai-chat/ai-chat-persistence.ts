import type { UIMessage } from "ai";

const DB_NAME = "commandly";
const DB_VERSION = 4;

export interface Chat {
  id: string;
  toolName: string;
  createdAt: number;
}

export interface StoredMessage {
  id: string;
  chatId: string;
  role: UIMessage["role"];
  parts: UIMessage["parts"];
  order: number;
}

export interface ChatWithPreview extends Chat {
  preview: string;
  updatedAt: number;
  messageCount: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (event) => {
      const db = req.result;
      const oldVersion = (event as IDBVersionChangeEvent).oldVersion;

      if (!db.objectStoreNames.contains("keys")) {
        db.createObjectStore("keys");
      }

      if (oldVersion < 4) {
        if (db.objectStoreNames.contains("sessions")) {
          db.deleteObjectStore("sessions");
        }
        if (db.objectStoreNames.contains("chats")) {
          db.deleteObjectStore("chats");
        }
        if (db.objectStoreNames.contains("messages")) {
          db.deleteObjectStore("messages");
        }
      }

      if (!db.objectStoreNames.contains("chats")) {
        const chatStore = db.createObjectStore("chats", { keyPath: "id" });
        chatStore.createIndex("toolName", "toolName", { unique: false });
      }
      if (!db.objectStoreNames.contains("messages")) {
        const msgStore = db.createObjectStore("messages", { keyPath: "id" });
        msgStore.createIndex("chatId", "chatId", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function toSerializable<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter(
      (part): part is Extract<UIMessage["parts"][number], { type: "text" }> => part.type === "text",
    )
    .map((part) => part.text)
    .join("");
}

export function hasPersistableContent(message: UIMessage): boolean {
  return message.parts.some((part) => {
    if (part.type === "text" || part.type === "reasoning") {
      return part.text.trim().length > 0;
    }
    return part.type !== "step-start";
  });
}

export function getPersistableMessages(messages: UIMessage[]): UIMessage[] {
  return messages.filter(
    (message) => message.role !== "assistant" || hasPersistableContent(message),
  );
}

export function getSessionPreview(messages: UIMessage[]): string {
  const firstUserMessage = messages.find((message) => message.role === "user");
  return getMessageText(firstUserMessage ?? { id: "", role: "user", parts: [] }).slice(0, 80);
}

export async function truncateMessages(chatId: string, keepCount: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("messages", "readwrite");
    const index = tx.objectStore("messages").index("chatId");
    const req = index.getAll(chatId);
    req.onsuccess = () => {
      for (const msg of req.result as StoredMessage[]) {
        if (msg.order >= keepCount) {
          tx.objectStore("messages").delete(msg.id);
        }
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function createChat(id: string, toolName: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("chats", "readwrite");
    tx.objectStore("chats").put({ id, toolName, createdAt: Date.now() } satisfies Chat);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function upsertMessage(
  chatId: string,
  message: UIMessage,
  order: number,
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["chats", "messages"], "readwrite");

    const chatStore = tx.objectStore("chats");
    const getChat = chatStore.get(chatId);
    getChat.onsuccess = () => {
      if (!getChat.result) {
        tx.abort();
        reject(new Error(`Chat ${chatId} not found`));
        return;
      }

      const stored: StoredMessage = {
        id: message.id,
        chatId,
        role: message.role,
        parts: toSerializable(message.parts),
        order,
      };
      tx.objectStore("messages").put(stored);
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadChat<UI_MESSAGE extends UIMessage = UIMessage>(
  chatId: string,
): Promise<UI_MESSAGE[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("messages", "readonly");
    const index = tx.objectStore("messages").index("chatId");
    const req = index.getAll(chatId);
    req.onsuccess = () => {
      const stored = (req.result as StoredMessage[]).sort((a, b) => a.order - b.order);
      resolve(
        stored.map((msg) => ({
          id: msg.id,
          role: msg.role,
          parts: msg.parts,
        })) as UI_MESSAGE[],
      );
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getChats(toolName: string, limit = 5): Promise<ChatWithPreview[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["chats", "messages"], "readonly");
    const chatIndex = tx.objectStore("chats").index("toolName");
    const chatReq = chatIndex.getAll(toolName);

    chatReq.onsuccess = () => {
      const chats = (chatReq.result as Chat[]).sort((a, b) => b.createdAt - a.createdAt);
      const msgIndex = tx.objectStore("messages").index("chatId");
      const results: ChatWithPreview[] = [];
      let pending = chats.length;

      if (pending === 0) {
        resolve([]);
        return;
      }

      for (const chat of chats) {
        const msgReq = msgIndex.getAll(chat.id);
        msgReq.onsuccess = () => {
          const stored = (msgReq.result as StoredMessage[]).sort((a, b) => a.order - b.order);
          const messages = stored.map(
            (m) => ({ id: m.id, role: m.role, parts: m.parts }) as UIMessage,
          );
          results.push({
            ...chat,
            preview: getSessionPreview(messages),
            updatedAt: chat.createdAt,
            messageCount: stored.length,
          });
          pending--;
          if (pending === 0) {
            results.sort((a, b) => b.createdAt - a.createdAt);
            resolve(results.slice(0, limit));
          }
        };
        msgReq.onerror = () => {
          pending--;
          if (pending === 0) {
            results.sort((a, b) => b.createdAt - a.createdAt);
            resolve(results.slice(0, limit));
          }
        };
      }
    };
    chatReq.onerror = () => reject(chatReq.error);
  });
}

export async function deleteChat(chatId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["chats", "messages"], "readwrite");

    tx.objectStore("chats").delete(chatId);

    const msgIndex = tx.objectStore("messages").index("chatId");
    const req = msgIndex.getAll(chatId);
    req.onsuccess = () => {
      for (const msg of req.result as StoredMessage[]) {
        tx.objectStore("messages").delete(msg.id);
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteMessage(messageId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("messages", "readwrite");

    const getReq = tx.objectStore("messages").get(messageId);
    getReq.onsuccess = () => {
      const target = getReq.result as StoredMessage | undefined;
      if (!target) {
        resolve();
        return;
      }

      const chatIndex = tx.objectStore("messages").index("chatId");
      const allReq = chatIndex.getAll(target.chatId);
      allReq.onsuccess = () => {
        for (const msg of allReq.result as StoredMessage[]) {
          if (msg.order >= target.order) {
            tx.objectStore("messages").delete(msg.id);
          }
        }
      };
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
