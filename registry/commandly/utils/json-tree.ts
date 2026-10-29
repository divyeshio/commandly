export type JsonValueType = "object" | "array" | "string" | "number" | "boolean" | "null" | "other";

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/** How many matches a search collects before giving up. */
const MAX_MATCHES = 2000;

export function typeOf(value: unknown): JsonValueType {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  switch (typeof value) {
    case "object":
      return "object";
    case "string":
      return "string";
    case "number":
    case "bigint":
      return "number";
    case "boolean":
      return "boolean";
    default:
      return "other";
  }
}

export const isBranch = (type: JsonValueType) => type === "object" || type === "array";

export function entries(value: unknown): [string | number, unknown][] {
  if (Array.isArray(value)) return value.map((item, index) => [index, item]);
  if (value && typeof value === "object") return Object.entries(value as Record<string, unknown>);
  return [];
}

/** The dot/bracket path of a child within its parent, e.g. `root.items[2].name`. */
export const childPath = (parent: string, key: string | number) =>
  typeof key === "number"
    ? `${parent}[${key}]`
    : IDENTIFIER.test(key)
      ? `${parent}.${key}`
      : `${parent}[${JSON.stringify(key)}]`;

/** Whether `id` is `ancestor` or sits beneath it. */
export const within = (ancestor: string, id: string) =>
  id === ancestor || id.startsWith(`${ancestor}.`) || id.startsWith(`${ancestor}[`);

export function primitiveText(value: unknown, type: JsonValueType) {
  if (type === "string") return value as string;
  if (type === "null") return "null";
  return String(value);
}

/** The text a copy action should place on the clipboard for this value. */
export function copyText(value: unknown, type: JsonValueType) {
  if (type === "string") return value as string;
  if (isBranch(type)) return JSON.stringify(value, null, 2);
  return primitiveText(value, type);
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

export const countLabel = (type: JsonValueType, count: number) =>
  type === "array" ? plural(count, "item", "items") : plural(count, "key", "keys");

/** The paths of every branch in the data, root first. */
export function allBranches(data: unknown, rootName: string) {
  const out: string[] = [];
  const visit = (value: unknown, id: string) => {
    if (!isBranch(typeOf(value))) return;
    out.push(id);
    for (const [key, child] of entries(value)) visit(child, childPath(id, key));
  };
  visit(data, rootName);
  return out;
}

/** The paths of every branch within the first `depth` levels. */
export function branchesToDepth(data: unknown, rootName: string, depth: number) {
  const out: string[] = [];
  const visit = (value: unknown, id: string, level: number) => {
    if (level >= depth || !isBranch(typeOf(value))) return;
    out.push(id);
    for (const [key, child] of entries(value)) visit(child, childPath(id, key), level + 1);
  };
  visit(data, rootName, 0);
  return out;
}

export interface SearchResult {
  /** The paths of every matching row, in document order. */
  matches: string[];
  /** The branches that must be open for every match to be reachable. */
  ancestors: Set<string>;
  /** Per branch, how many of its children must be listed for every match to be reachable. */
  needed: Map<string, number>;
}

/** A case-insensitive search over keys and primitive values. */
export function searchJson(data: unknown, rootName: string, needle: string): SearchResult {
  const matches: string[] = [];
  const ancestors = new Set<string>();
  const needed = new Map<string, number>();
  const frames: [string, number][] = [];
  const visit = (value: unknown, id: string, name: string | number | null) => {
    if (matches.length >= MAX_MATCHES) return;
    const type = typeOf(value);
    const inKey = typeof name === "string" && name.toLowerCase().includes(needle);
    const inValue = !isBranch(type) && primitiveText(value, type).toLowerCase().includes(needle);
    if (inKey || inValue) {
      matches.push(id);
      for (const [frame, index] of frames) {
        ancestors.add(frame);
        needed.set(frame, Math.max(needed.get(frame) ?? 0, index + 1));
      }
    }
    if (!isBranch(type)) return;
    entries(value).forEach(([key, child], index) => {
      frames.push([id, index]);
      visit(child, childPath(id, key), key);
      frames.pop();
    });
  };
  visit(data, rootName, null);
  return { matches, ancestors, needed };
}
