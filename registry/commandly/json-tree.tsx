import { writeClipboard } from "@/components/commandly/utils/clipboard";
import {
  allBranches,
  branchesToDepth,
  childPath,
  copyText,
  countLabel,
  entries,
  isBranch,
  primitiveText,
  searchJson,
  type JsonValueType,
  typeOf,
  within,
} from "@/components/commandly/utils/json-tree";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronsDownUpIcon,
  ChevronsUpDownIcon,
  ChevronUpIcon,
  CopyIcon,
  Link2Icon,
  SearchIcon,
} from "lucide-react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { useCallback, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const INDENT = 14;

const VALUE_CLASS: Record<JsonValueType, string> = {
  object: "text-sky-600 dark:text-sky-400",
  array: "text-sky-600 dark:text-sky-400",
  string: "text-emerald-600 dark:text-emerald-400",
  number: "text-amber-600 dark:text-amber-400",
  boolean: "text-violet-600 dark:text-violet-400",
  null: "text-muted-foreground italic",
  other: "text-muted-foreground",
};

function Highlight({ text, needle, current }: { text: string; needle: string; current: boolean }) {
  if (!needle) return <>{text}</>;
  const lower = text.toLowerCase();
  const parts: ReactNode[] = [];
  let from = 0;
  let at = lower.indexOf(needle);
  while (at !== -1) {
    if (at > from) parts.push(text.slice(from, at));
    parts.push(
      <mark
        key={at}
        className={cn(
          "rounded-[2px] bg-yellow-300/60 text-inherit dark:bg-yellow-500/40",
          current && "bg-orange-400/70 dark:bg-orange-500/60",
        )}
      >
        {text.slice(at, at + needle.length)}
      </mark>,
    );
    from = at + needle.length;
    at = lower.indexOf(needle, from);
  }
  if (from < text.length) parts.push(text.slice(from));
  return <>{parts}</>;
}

type TreeRow = {
  id: string;
  kind: "node" | "more";
  level: number;
  name: string | number | null;
  value: unknown;
  type: JsonValueType;
  count: number;
  open: boolean;
  parent: string | null;
  posinset: number;
  setsize: number;
  hidden?: number;
};

export interface JsonTreeProps {
  data: unknown;
  rootName?: string;
  defaultExpandDepth?: number;
  pageSize?: number;
  className?: string;
}

function IconAction({
  label,
  onClick,
  disabled,
  tabIndex,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tabIndex?: number;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label={label}
      title={label}
      disabled={disabled}
      tabIndex={tabIndex}
      className="text-muted-foreground"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      {children}
    </Button>
  );
}

export function JsonTree({
  data,
  rootName = "root",
  defaultExpandDepth = 2,
  pageSize = 50,
  className,
}: JsonTreeProps) {
  const treeId = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const rowRefs = useRef(new Map<string, HTMLDivElement>());

  const [expanded, setExpanded] = useState<string[]>(() =>
    branchesToDepth(data, rootName, defaultExpandDepth),
  );
  const base = useMemo(() => new Set(expanded), [expanded]);

  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const search = useMemo(
    () => (needle ? searchJson(data, rootName, needle) : null),
    [data, needle, rootName],
  );
  const [closedWhileSearching, setClosedWhileSearching] = useState<{
    needle: string;
    ids: Set<string>;
  }>({ needle: "", ids: new Set<string>() });
  const closed = closedWhileSearching.needle === needle ? closedWhileSearching.ids : null;
  const [matchIndex, setMatchIndex] = useState(0);
  const matches = search?.matches ?? [];
  const matchCount = matches.length;
  const matchSet = useMemo(() => new Set(search?.matches ?? []), [search]);
  const currentMatch = matchCount ? matches[Math.min(matchIndex, matchCount - 1)] : null;

  const isOpen = useCallback(
    (id: string) => (search?.ancestors.has(id) ? !closed?.has(id) : base.has(id)),
    [base, closed, search],
  );

  const [pages, setPages] = useState<Record<string, number>>({});
  const limitOf = useCallback(
    (id: string) => Math.max((pages[id] ?? 1) * pageSize, search?.needed.get(id) ?? 0),
    [pageSize, pages, search],
  );

  const rows = useMemo(() => {
    const out: TreeRow[] = [];
    const visit = (
      value: unknown,
      id: string,
      name: string | number | null,
      level: number,
      parent: string | null,
      posinset: number,
      setsize: number,
    ) => {
      const type = typeOf(value);
      const list = isBranch(type) ? entries(value) : [];
      const open = isBranch(type) && isOpen(id);
      out.push({
        id,
        kind: "node",
        level,
        name,
        value,
        type,
        count: list.length,
        open,
        parent,
        posinset,
        setsize,
      });
      if (!open) return;
      const shown = list.slice(0, limitOf(id));
      const hidden = list.length - shown.length;
      const size = shown.length + (hidden > 0 ? 1 : 0);
      shown.forEach(([key, child], index) =>
        visit(child, childPath(id, key), key, level + 1, id, index + 1, size),
      );
      if (hidden > 0) {
        out.push({
          id: `${id}::more`,
          kind: "more",
          level: level + 1,
          name: null,
          value: null,
          type: "other",
          count: 0,
          open: false,
          parent: id,
          posinset: size,
          setsize: size,
          hidden,
        });
      }
    };
    visit(data, rootName, null, 1, null, 1, 1);
    return out;
  }, [data, isOpen, limitOf, rootName]);

  const [activeRaw, setActiveRaw] = useState(rootName);
  const active = useMemo(() => {
    if (rows.some((row) => row.id === activeRaw)) return activeRaw;
    let best = rootName;
    for (const row of rows) {
      if (row.kind === "node" && within(row.id, activeRaw) && row.id.length > best.length) {
        best = row.id;
      }
    }
    return best;
  }, [activeRaw, rootName, rows]);
  const activeIndex = Math.max(
    0,
    rows.findIndex((row) => row.id === active),
  );
  const activeRow = rows[activeIndex];

  const pendingFocus = useRef(false);
  const pendingReveal = useRef(false);

  useLayoutEffect(() => {
    if (pendingFocus.current) {
      pendingFocus.current = false;
      rowRefs.current.get(active)?.focus({ preventScroll: true });
    }
    if (pendingReveal.current) {
      pendingReveal.current = false;
      rowRefs.current.get(active)?.scrollIntoView({ block: "nearest" });
    }
  }, [active, rows]);

  const moveTo = (id: string, focus = true, reveal = true) => {
    if (id === activeRaw) {
      if (focus) rowRefs.current.get(id)?.focus({ preventScroll: true });
      if (reveal) rowRefs.current.get(id)?.scrollIntoView({ block: "nearest" });
      return;
    }
    pendingFocus.current = focus;
    pendingReveal.current = reveal;
    setActiveRaw(id);
  };

  // Reveal the first match once the search has recomputed for the new query.
  const revealedFor = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (revealedFor.current === needle) return;
    revealedFor.current = needle;
    const first = search?.matches[0];
    if (!first) return;
    pendingReveal.current = true;
    setActiveRaw(first);
  }, [needle, search]);

  const toggle = (id: string, next?: boolean) => {
    const open = isOpen(id);
    const want = next ?? !open;
    if (want === open) return;
    if (search?.ancestors.has(id)) {
      const ids = new Set(closed ?? []);
      if (want) ids.delete(id);
      else ids.add(id);
      setClosedWhileSearching({ needle, ids });
      if (want && !base.has(id)) setExpanded([...base, id]);
      return;
    }
    setExpanded(want ? [...base, id] : [...base].filter((item) => item !== id));
  };

  const expandAll = () => {
    setExpanded(allBranches(data, rootName));
    setClosedWhileSearching({ needle, ids: new Set<string>() });
    setPages({});
    moveTo(active, false);
  };

  const collapseAll = () => {
    setExpanded(isBranch(typeOf(data)) ? [rootName] : []);
    setClosedWhileSearching({
      needle,
      ids: new Set([...(search?.ancestors ?? [])].filter((id) => id !== rootName)),
    });
    setPages({});
    moveTo(rootName, false, false);
  };

  const showMore = (parent: string) =>
    setPages((current) => ({ ...current, [parent]: Math.ceil(limitOf(parent) / pageSize) + 1 }));

  const copy = (row: TreeRow, kind: "value" | "path") => {
    const text = kind === "path" ? row.id : copyText(row.value, row.type);
    writeClipboard(text).then(
      () => toast(kind === "path" ? "Copied path" : "Copied value"),
      () => toast.error("Copy failed"),
    );
  };

  const stepMatch = (step: number) => {
    if (!matchCount) return;
    const next =
      (((Math.min(matchIndex, matchCount - 1) + step) % matchCount) + matchCount) % matchCount;
    setMatchIndex(next);
    moveTo(matches[next], false);
  };

  const onQuery = (next: string) => {
    setQuery(next);
    setMatchIndex(0);
  };

  const onSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      stepMatch(event.shiftKey ? -1 : 1);
    } else if (event.key === "Escape" && query) {
      event.preventDefault();
      event.stopPropagation();
      onQuery("");
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      moveTo(active);
    }
  };

  const onTreeKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const row = rows[activeIndex];
    if (!row || event.altKey) return;
    const mod = event.metaKey || event.ctrlKey;
    if (mod && event.key.toLowerCase() === "c") {
      if (row.kind === "node" && !window.getSelection()?.toString()) {
        event.preventDefault();
        copy(row, event.shiftKey ? "path" : "value");
      }
      return;
    }
    if (mod) return;
    const go = (index: number) => {
      event.preventDefault();
      const target = rows[Math.max(0, Math.min(rows.length - 1, index))];
      if (target) moveTo(target.id);
    };
    switch (event.key) {
      case "ArrowDown":
        go(activeIndex + 1);
        break;
      case "ArrowUp":
        go(activeIndex - 1);
        break;
      case "Home":
        go(0);
        break;
      case "End":
        go(rows.length - 1);
        break;
      case "ArrowRight":
        event.preventDefault();
        if (row.kind === "node" && isBranch(row.type)) {
          if (!row.open) toggle(row.id, true);
          else if (row.count) go(activeIndex + 1);
        }
        break;
      case "ArrowLeft":
        event.preventDefault();
        if (row.kind === "node" && row.open) toggle(row.id, false);
        else if (row.parent) moveTo(row.parent);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (row.kind === "more") showMore(row.parent ?? rootName);
        else if (isBranch(row.type)) toggle(row.id);
        break;
      case "/":
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
        break;
      default:
        break;
    }
  };

  const describe = (row: TreeRow) => {
    const name = row.name === null ? rootName : String(row.name);
    if (row.kind === "more") {
      return `Show ${Math.min(pageSize, row.hidden ?? 0)} more, ${row.hidden} hidden`;
    }
    if (isBranch(row.type)) return `${name}, ${row.type}, ${countLabel(row.type, row.count)}`;
    const text = primitiveText(row.value, row.type);
    return `${name}: ${text.length > 60 ? `${text.slice(0, 60)}…` : text}`;
  };

  const pathOf = (row: TreeRow) => (row.kind === "node" ? row.id : (row.parent ?? ""));

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative flex h-8 min-w-0 flex-1 items-center">
          <SearchIcon
            className="pointer-events-none absolute left-2 size-3.5 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            onKeyDown={onSearchKeyDown}
            placeholder="Search keys and values"
            aria-label="Search JSON"
            aria-controls={treeId}
            spellCheck={false}
            autoComplete="off"
            className={cn(
              "h-8 w-full rounded-lg border border-input bg-transparent pr-16 pl-7 text-sm outline-none",
              "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              "[&::-webkit-search-cancel-button]:hidden",
            )}
          />
          {needle ? (
            <span className="absolute right-1 flex items-center gap-0.5">
              <span
                className="px-1 text-xs text-muted-foreground tabular-nums"
                aria-live="polite"
              >
                {matchCount ? `${Math.min(matchIndex, matchCount - 1) + 1}/${matchCount}` : "0/0"}
              </span>
              <IconAction
                label="Previous match"
                disabled={!matchCount}
                onClick={() => stepMatch(-1)}
              >
                <ChevronUpIcon />
              </IconAction>
              <IconAction
                label="Next match"
                disabled={!matchCount}
                onClick={() => stepMatch(1)}
              >
                <ChevronDownIcon />
              </IconAction>
            </span>
          ) : null}
        </label>
        <div className="flex shrink-0 items-center gap-1">
          <IconAction
            label="Expand all"
            onClick={expandAll}
          >
            <ChevronsUpDownIcon />
          </IconAction>
          <IconAction
            label="Collapse all"
            onClick={collapseAll}
          >
            <ChevronsDownUpIcon />
          </IconAction>
        </div>
      </div>

      <div className="max-h-[calc(100vh-420px)] overflow-auto rounded-lg border">
        <div
          id={treeId}
          role="tree"
          aria-label="Tool JSON"
          onKeyDown={onTreeKeyDown}
          className="w-fit min-w-full py-1 outline-none"
        >
          {rows.map((row) => {
            const isActive = row.id === active;
            const branch = isBranch(row.type);
            const mark = search && row.kind === "node" && matchSet.has(row.id) ? needle : "";
            const current = row.id === currentMatch;
            return (
              <div
                key={row.id}
                ref={(node) => {
                  if (node) rowRefs.current.set(row.id, node);
                  else rowRefs.current.delete(row.id);
                }}
                role="treeitem"
                tabIndex={isActive ? 0 : -1}
                aria-level={row.level}
                aria-posinset={row.posinset}
                aria-setsize={row.setsize}
                aria-expanded={row.kind === "node" && branch ? row.open : undefined}
                aria-selected={isActive}
                aria-label={describe(row)}
                className={cn(
                  "group relative flex h-7.5 items-center gap-1 pr-1 text-sm outline-none",
                  "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset",
                  isActive ? "bg-accent/60" : "hover:bg-muted/60",
                )}
                style={{ paddingLeft: (row.level - 1) * INDENT + 4 }}
                onFocus={(event) => {
                  if (event.target === event.currentTarget && row.id !== active) {
                    setActiveRaw(row.id);
                  }
                }}
                onClick={() => {
                  if (row.kind === "more") {
                    showMore(row.parent ?? rootName);
                    moveTo(row.id);
                    return;
                  }
                  if (branch) toggle(row.id);
                  moveTo(row.id);
                }}
              >
                {row.kind === "more" ? (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span>Show {Math.min(pageSize, row.hidden ?? 0)} more</span>
                    <span className="text-xs">{row.hidden} hidden</span>
                  </span>
                ) : (
                  <>
                    <span className="flex size-4 shrink-0 items-center justify-center text-muted-foreground">
                      {branch ? (
                        <ChevronRightIcon
                          className={cn("size-3.5 transition-transform", row.open && "rotate-90")}
                          aria-hidden="true"
                        />
                      ) : null}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 font-medium",
                        typeof row.name === "number" && "text-muted-foreground",
                      )}
                    >
                      {row.name === null ? (
                        rootName
                      ) : typeof row.name === "number" ? (
                        row.name
                      ) : (
                        <Highlight
                          text={row.name}
                          needle={mark}
                          current={current}
                        />
                      )}
                    </span>
                    <span
                      className="text-muted-foreground"
                      aria-hidden="true"
                    >
                      {row.name === null && branch ? "" : ":"}
                    </span>
                    {branch ? (
                      <span className="flex min-w-0 items-baseline gap-2">
                        {!row.open ? (
                          <span className="truncate text-muted-foreground">
                            {row.type === "array"
                              ? "[…]"
                              : `{ ${entries(row.value)
                                  .slice(0, 3)
                                  .map(([key]) => key)
                                  .join(", ")}${row.count > 3 ? ", …" : ""} }`}
                          </span>
                        ) : null}
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {countLabel(row.type, row.count)}
                        </span>
                      </span>
                    ) : (
                      <span
                        className={cn("min-w-0 truncate font-mono", VALUE_CLASS[row.type])}
                        title={
                          row.type === "string" && (row.value as string).length > 40
                            ? (row.value as string)
                            : undefined
                        }
                      >
                        {row.type === "string" ? (
                          <>
                            &quot;
                            <Highlight
                              text={row.value as string}
                              needle={mark}
                              current={current}
                            />
                            &quot;
                          </>
                        ) : (
                          <Highlight
                            text={primitiveText(row.value, row.type)}
                            needle={mark}
                            current={current}
                          />
                        )}
                      </span>
                    )}
                    <span
                      className={cn(
                        "ml-auto flex shrink-0 items-center gap-0.5",
                        isActive
                          ? "opacity-100"
                          : "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100",
                      )}
                    >
                      <IconAction
                        label="Copy value"
                        tabIndex={-1}
                        onClick={() => copy(row, "value")}
                      >
                        <CopyIcon />
                      </IconAction>
                      <IconAction
                        label="Copy path"
                        tabIndex={-1}
                        onClick={() => copy(row, "path")}
                      >
                        <Link2Icon />
                      </IconAction>
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {activeRow ? (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-2 py-1.5">
          <code
            className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground"
            title={pathOf(activeRow)}
          >
            {pathOf(activeRow)}
          </code>
          <span className="shrink-0 text-xs text-muted-foreground">
            {activeRow.kind === "node"
              ? isBranch(activeRow.type)
                ? `${activeRow.type}, ${countLabel(activeRow.type, activeRow.count)}`
                : activeRow.type
              : "page"}
          </span>
          {activeRow.kind === "node" ? (
            <IconAction
              label="Copy path"
              tabIndex={-1}
              onClick={() => copy(activeRow, "path")}
            >
              <CopyIcon />
            </IconAction>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
