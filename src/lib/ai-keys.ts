import { useEffect, useRef, useState } from "react";

export type AIProvider =
  | "openai"
  | "openrouter"
  | "anthropic"
  | "google"
  | "groq"
  | "mistral"
  | "xai"
  | "tavily";

const STORAGE_KEYS: Record<AIProvider, string> = {
  openai: "ai-api-key",
  openrouter: "ai-api-key-openrouter",
  anthropic: "ai-api-key-anthropic",
  google: "ai-api-key-google",
  groq: "ai-api-key-groq",
  mistral: "ai-api-key-mistral",
  xai: "ai-api-key-xai",
  tavily: "ai-api-key-tavily",
};

const DB_NAME = "commandly";
const STORE_NAME = "keys";
const KEY_ID = "master-key";

function getOrCreateCryptoKey(): Promise<CryptoKey> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 4);
    request.onupgradeneeded = (event) => {
      const db = request.result;
      const oldVersion = (event as IDBVersionChangeEvent).oldVersion;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
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
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(KEY_ID);
      getReq.onerror = () => reject(getReq.error);
      getReq.onsuccess = () => {
        if (getReq.result) {
          resolve(getReq.result as CryptoKey);
        } else {
          crypto.subtle
            .generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"])
            .then((newKey) => {
              store.put(newKey, KEY_ID);
              resolve(newKey);
            })
            .catch(reject);
        }
      };
    };
  });
}

async function encryptValue(cryptoKey: CryptoKey, plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cryptoKey, encoded);
  const ivB64 = btoa(String.fromCharCode(...iv));
  const ctB64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)));
  return `${ivB64}:${ctB64}`;
}

async function decryptValue(cryptoKey: CryptoKey, encrypted: string): Promise<string> {
  const colonIdx = encrypted.indexOf(":");
  if (colonIdx === -1) throw new Error("Invalid encrypted value format");
  const iv = Uint8Array.from(atob(encrypted.slice(0, colonIdx)), (c) => c.charCodeAt(0));
  const ciphertext = Uint8Array.from(atob(encrypted.slice(colonIdx + 1)), (c) => c.charCodeAt(0));
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, cryptoKey, ciphertext);
  return new TextDecoder().decode(decrypted);
}

export function useAIKeys(provider: AIProvider) {
  const storageKey = STORAGE_KEYS[provider];
  const [key, setKeyState] = useState("");
  const [isSaved, setIsSavedState] = useState(false);
  const cryptoKeyRef = useRef<CryptoKey | null>(null);

  useEffect(() => {
    getOrCreateCryptoKey().then(async (cryptoKey) => {
      cryptoKeyRef.current = cryptoKey;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const decrypted = await decryptValue(cryptoKey, stored);
          setKeyState(decrypted);
          setIsSavedState(true);
        } catch {
          localStorage.removeItem(storageKey);
        }
      }
    });
  }, [storageKey]);

  const setKey = (newKey: string) => {
    setKeyState(newKey);
    if (isSaved && newKey.trim() && cryptoKeyRef.current) {
      encryptValue(cryptoKeyRef.current, newKey).then((encrypted) => {
        localStorage.setItem(storageKey, encrypted);
      });
    }
  };

  const setSaved = (save: boolean) => {
    if (save && key.trim() && cryptoKeyRef.current) {
      encryptValue(cryptoKeyRef.current, key).then((encrypted) => {
        localStorage.setItem(storageKey, encrypted);
      });
    } else {
      localStorage.removeItem(storageKey);
    }
    setIsSavedState(save);
  };

  return { key, setKey, isSaved, setSaved };
}
