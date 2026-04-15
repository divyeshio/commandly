import {
  addSavedCommandToStorage,
  clearSavedCommandsFromStorage,
  getSavedCommandsFromStorage,
  removeSavedCommandFromStorage,
  saveSavedCommandsToStorage,
} from "@/lib/editor-utils";
import { afterEach, beforeEach } from "vitest";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("getSavedCommandsFromStorage", () => {
  it("returns an empty array when nothing is stored", () => {
    expect(getSavedCommandsFromStorage("curl")).toEqual([]);
  });

  it("returns stored commands for the given toolId", () => {
    const commands = [{ key: "cmd-1", command: "curl -X GET https://api.example.com" }];
    localStorage.setItem("saved-curl", JSON.stringify(commands));
    expect(getSavedCommandsFromStorage("curl")).toEqual(commands);
  });

  it("does not mix commands between different tools", () => {
    localStorage.setItem("saved-curl", JSON.stringify([{ key: "a", command: "curl foo" }]));
    localStorage.setItem("saved-npm", JSON.stringify([{ key: "b", command: "npm install" }]));
    expect(getSavedCommandsFromStorage("curl")).toHaveLength(1);
    expect(getSavedCommandsFromStorage("npm")).toHaveLength(1);
    expect(getSavedCommandsFromStorage("curl")[0].command).toBe("curl foo");
  });

  it("returns an empty array for corrupt JSON", () => {
    localStorage.setItem("saved-curl", "not-valid-json");
    expect(getSavedCommandsFromStorage("curl")).toEqual([]);
  });
});

describe("saveSavedCommandsToStorage", () => {
  it("persists commands under the correct key", () => {
    const commands = [{ key: "cmd-1", command: "curl -X POST https://api.example.com" }];
    saveSavedCommandsToStorage("curl", commands);
    const raw = localStorage.getItem("saved-curl");
    expect(JSON.parse(raw!)).toEqual(commands);
  });

  it("overwrites previously stored commands", () => {
    saveSavedCommandsToStorage("curl", [{ key: "old", command: "old cmd" }]);
    saveSavedCommandsToStorage("curl", [{ key: "new", command: "new cmd" }]);
    expect(getSavedCommandsFromStorage("curl")).toEqual([{ key: "new", command: "new cmd" }]);
  });
});

describe("addSavedCommandToStorage", () => {
  it("adds the first command to an empty store", () => {
    addSavedCommandToStorage("curl", { key: "cmd-1", command: "curl foo" });
    expect(getSavedCommandsFromStorage("curl")).toEqual([{ key: "cmd-1", command: "curl foo" }]);
  });

  it("appends to existing commands without removing them", () => {
    addSavedCommandToStorage("curl", { key: "cmd-1", command: "curl foo" });
    addSavedCommandToStorage("curl", { key: "cmd-2", command: "curl bar" });
    expect(getSavedCommandsFromStorage("curl")).toHaveLength(2);
  });

  it("does not affect commands for another tool", () => {
    addSavedCommandToStorage("curl", { key: "cmd-1", command: "curl foo" });
    expect(getSavedCommandsFromStorage("npm")).toEqual([]);
  });
});

describe("removeSavedCommandFromStorage", () => {
  it("removes only the command with the matching key", () => {
    saveSavedCommandsToStorage("curl", [
      { key: "cmd-1", command: "curl foo" },
      { key: "cmd-2", command: "curl bar" },
    ]);
    removeSavedCommandFromStorage("curl", "cmd-1");
    const remaining = getSavedCommandsFromStorage("curl");
    expect(remaining).toHaveLength(1);
    expect(remaining[0].key).toBe("cmd-2");
  });

  it("does nothing when the key does not exist", () => {
    saveSavedCommandsToStorage("curl", [{ key: "cmd-1", command: "curl foo" }]);
    removeSavedCommandFromStorage("curl", "nonexistent");
    expect(getSavedCommandsFromStorage("curl")).toHaveLength(1);
  });

  it("results in an empty list when the last command is removed", () => {
    saveSavedCommandsToStorage("curl", [{ key: "cmd-1", command: "curl foo" }]);
    removeSavedCommandFromStorage("curl", "cmd-1");
    expect(getSavedCommandsFromStorage("curl")).toEqual([]);
  });
});

describe("clearSavedCommandsFromStorage", () => {
  it("removes all saved commands for the given tool", () => {
    saveSavedCommandsToStorage("curl", [{ key: "cmd-1", command: "curl foo" }]);
    clearSavedCommandsFromStorage("curl");
    expect(getSavedCommandsFromStorage("curl")).toEqual([]);
  });

  it("does not affect commands for other tools", () => {
    saveSavedCommandsToStorage("curl", [{ key: "cmd-1", command: "curl foo" }]);
    saveSavedCommandsToStorage("npm", [{ key: "cmd-2", command: "npm install" }]);
    clearSavedCommandsFromStorage("curl");
    expect(getSavedCommandsFromStorage("npm")).toHaveLength(1);
  });
});
