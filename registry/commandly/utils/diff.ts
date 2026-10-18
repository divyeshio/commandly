export type DiffLineType = "same" | "added" | "removed";

export interface DiffLine {
  type: DiffLineType;
  text: string;
}

/** An unchanged run the display collapsed into a single row. */
export interface DiffGap {
  type: "gap";
  /** How many unchanged lines the gap stands for. */
  count: number;
}

/** A diff as the display wants it: a line, or a collapsed run of unchanged lines. */
export type DiffRow = DiffLine | DiffGap;

/**
 * Above this many differing lines on either side the comparison falls back to a plain
 * replacement: the longest-common-subsequence matrix is quadratic in memory and time. Only the
 * lines between the shared head and tail are ever compared, so a localised edit to a very large
 * file still diffs exactly.
 */
export const MAX_DIFF_LINES = 2000;

/** How many unchanged lines the display keeps on either side of a change. */
export const DIFF_CONTEXT_LINES = 3;

const same = (text: string): DiffLine => ({ type: "same", text });

/** How many leading lines `a` and `b` have in common. */
const sharedHead = (a: string[], b: string[]): number => {
  const max = Math.min(a.length, b.length);
  let head = 0;
  while (head < max && a[head] === b[head]) head++;
  return head;
};

/** How many trailing lines `a` and `b` have in common, past the `head` already claimed. */
const sharedTail = (a: string[], b: string[], head: number): number => {
  const max = Math.min(a.length, b.length) - head;
  let tail = 0;
  while (tail < max && a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail++;
  return tail;
};

const replaceBlock = (removed: string[], added: string[]): DiffLine[] => [
  ...removed.map((text): DiffLine => ({ type: "removed", text })),
  ...added.map((text): DiffLine => ({ type: "added", text })),
];

/** The longest-common-subsequence comparison of two line arrays. */
const compareLines = (before: string[], after: string[]): DiffLine[] => {
  if (before.length > MAX_DIFF_LINES || after.length > MAX_DIFF_LINES) {
    return replaceBlock(before, after);
  }

  const rows = before.length;
  const columns = after.length;
  const lengths = Array.from({ length: rows + 1 }, () => new Array<number>(columns + 1).fill(0));

  for (let i = 1; i <= rows; i++) {
    for (let j = 1; j <= columns; j++) {
      lengths[i][j] =
        before[i - 1] === after[j - 1]
          ? lengths[i - 1][j - 1] + 1
          : Math.max(lengths[i - 1][j], lengths[i][j - 1]);
    }
  }

  const diff: DiffLine[] = [];
  let i = rows;
  let j = columns;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && before[i - 1] === after[j - 1]) {
      diff.unshift(same(before[i - 1]));
      i--;
      j--;
    } else if (j > 0 && (i === 0 || lengths[i][j - 1] >= lengths[i - 1][j])) {
      diff.unshift({ type: "added", text: after[j - 1] });
      j--;
    } else {
      diff.unshift({ type: "removed", text: before[i - 1] });
      i--;
    }
  }

  return diff;
};

/** A line-level diff of two texts, unchanged lines included. */
export const diffLines = (before: string, after: string): DiffLine[] => {
  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");

  const head = sharedHead(beforeLines, afterLines);
  const tail = sharedTail(beforeLines, afterLines, head);

  return [
    ...beforeLines.slice(0, head).map(same),
    ...compareLines(
      beforeLines.slice(head, beforeLines.length - tail),
      afterLines.slice(head, afterLines.length - tail),
    ),
    ...beforeLines.slice(beforeLines.length - tail).map(same),
  ];
};

/**
 * The rows a diff should be drawn with: an unchanged run longer than two context windows collapses
 * to a single gap, so a large file with a small edit stays readable.
 */
export const collapseUnchanged = (diff: DiffLine[], context = DIFF_CONTEXT_LINES): DiffRow[] => {
  const rows: DiffRow[] = [];

  for (let index = 0; index < diff.length;) {
    if (diff[index].type !== "same") {
      rows.push(diff[index]);
      index++;
      continue;
    }

    let end = index;
    while (end < diff.length && diff[end].type === "same") end++;

    if (end - index > context * 2) {
      rows.push(
        ...diff.slice(index, index + context),
        { type: "gap", count: end - index - context * 2 },
        ...diff.slice(end - context, end),
      );
    } else {
      rows.push(...diff.slice(index, end));
    }
    index = end;
  }

  return rows;
};
