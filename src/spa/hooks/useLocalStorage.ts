import { useState, useEffect } from "react";

function getStorageValue<T>(key: string, defaultValue: T): T {
  // getting stored value
  const saved = localStorage.getItem(key);
  if (saved === null) return defaultValue;
  try {
    return JSON.parse(saved);
  } catch {
    return defaultValue;
  }
}

export const useLocalStorage = <T>(
  key: string,
  defaultValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [value, setValue] = useState<T>(() => {
    return getStorageValue(key, defaultValue);
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
};
