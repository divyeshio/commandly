import { SavedCommand } from "./types";

export const getSavedCommandsFromStorage = (toolId: string): SavedCommand[] => {
  try {
    const saved = localStorage.getItem(`saved-${toolId}`);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const saveSavedCommandsToStorage = (toolId: string, commands: SavedCommand[]): void => {
  try {
    localStorage.setItem(toolId, JSON.stringify(commands));
  } catch (error) {
    console.error("Failed to save commands to localStorage:", error);
  }
};

export const addSavedCommandToStorage = (toolId: string, command: SavedCommand): void => {
  const existingCommands = getSavedCommandsFromStorage(toolId);
  const updatedCommands = [...existingCommands, command];
  saveSavedCommandsToStorage(toolId, updatedCommands);
};

export const removeSavedCommandFromStorage = (toolId: string, commandKey: string): void => {
  const existingCommands = getSavedCommandsFromStorage(toolId);
  const updatedCommands = existingCommands.filter((cmd) => cmd.key !== commandKey);
  saveSavedCommandsToStorage(toolId, updatedCommands);
};

export const clearSavedCommandsFromStorage = (toolId: string): void => {
  localStorage.removeItem(toolId);
};
