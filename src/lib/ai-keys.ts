import { useState } from "react";

export type AIProvider = "openai" | "anthropic" | "google" | "groq" | "mistral" | "xai" | "tavily";

const STORAGE_KEYS: Record<AIProvider, string> = {
  openai: "ai-api-key",
  anthropic: "ai-api-key-anthropic",
  google: "ai-api-key-google",
  groq: "ai-api-key-groq",
  mistral: "ai-api-key-mistral",
  xai: "ai-api-key-xai",
  tavily: "ai-api-key-tavily",
};

export function useAIKeys(provider: AIProvider) {
  const storageKey = STORAGE_KEYS[provider];
  const [key, setKeyState] = useState(() => localStorage.getItem(storageKey) ?? "");
  const [isSaved, setIsSavedState] = useState(() => !!localStorage.getItem(storageKey));

  const setKey = (newKey: string) => {
    setKeyState(newKey);
    if (isSaved && newKey.trim()) {
      localStorage.setItem(storageKey, newKey);
    }
  };

  const setSaved = (save: boolean) => {
    if (save && key.trim()) {
      localStorage.setItem(storageKey, key);
    } else {
      localStorage.removeItem(storageKey);
    }
    setIsSavedState(save);
  };

  return { key, setKey, isSaved, setSaved };
}
