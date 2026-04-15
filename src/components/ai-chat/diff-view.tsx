import { Tool } from "@/components/commandly/types/flat";
import { exportToStructuredJSON } from "@/components/commandly/utils/flat";
import { cn } from "@/lib/utils";

function computeLineDiff(
  a: string,
  b: string,
): Array<{ type: "same" | "add" | "remove"; text: string }> {
  const aLines = a.split("\n");
  const bLines = b.split("\n");
  const m = aLines.length;
  const n = bLines.length;
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        aLines[i - 1] === bLines[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const result: Array<{ type: "same" | "add" | "remove"; text: string }> = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && aLines[i - 1] === bLines[j - 1]) {
      result.unshift({ type: "same", text: aLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: "add", text: bLines[j - 1] });
      j--;
    } else {
      result.unshift({ type: "remove", text: aLines[i - 1] });
      i--;
    }
  }

  return result;
}

export function DiffView({ original, updated }: { original: Tool; updated: Tool }) {
  const aJson = JSON.stringify(exportToStructuredJSON(original), null, 2);
  const bJson = JSON.stringify(exportToStructuredJSON(updated), null, 2);
  const diff = computeLineDiff(aJson, bJson);
  const visibleSet = new Set<number>();

  for (const index of diff.flatMap((line, currentIndex) =>
    line.type !== "same" ? [currentIndex] : [],
  )) {
    for (
      let cursor = Math.max(0, index - 2);
      cursor <= Math.min(diff.length - 1, index + 2);
      cursor++
    ) {
      visibleSet.add(cursor);
    }
  }

  if (visibleSet.size === 0) {
    return <p className="text-xs text-muted-foreground">No changes</p>;
  }

  const sortedIndices = [...visibleSet].sort((a, b) => a - b);
  const chunks: number[][] = [];
  let currentChunk: number[] = [];

  for (let index = 0; index < sortedIndices.length; index++) {
    if (currentChunk.length === 0 || sortedIndices[index] === sortedIndices[index - 1] + 1) {
      currentChunk.push(sortedIndices[index]);
      continue;
    }

    chunks.push(currentChunk);
    currentChunk = [sortedIndices[index]];
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return (
    <div className="max-h-48 overflow-y-auto rounded border border-border/40 bg-muted/20 font-mono text-[11px]">
      {chunks.map((chunk, chunkIndex) => (
        <div key={chunkIndex}>
          {chunkIndex > 0 && (
            <div className="bg-muted/30 px-2 py-0.5 text-muted-foreground">···</div>
          )}
          {chunk.map((lineIndex) => {
            const line = diff[lineIndex];
            return (
              <div
                key={lineIndex}
                className={cn(
                  "px-2 py-px whitespace-pre",
                  line.type === "add" && "bg-green-500/10 text-green-600 dark:text-green-400",
                  line.type === "remove" &&
                    "bg-red-500/10 text-red-500 line-through opacity-70 dark:text-red-400",
                  line.type === "same" && "text-muted-foreground",
                )}
              >
                {line.type === "add" ? "+ " : line.type === "remove" ? "- " : "  "}
                {line.text}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
