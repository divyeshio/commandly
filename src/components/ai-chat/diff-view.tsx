import { Tool } from "@/components/commandly/types/tool";
import { diffLines } from "@/components/commandly/utils/diff";
import { exportToStructuredJSON } from "@/components/commandly/utils/tool-file";
import { cn } from "@/lib/utils";

export function DiffView({ original, updated }: { original: Tool; updated: Tool }) {
  const updatedJson = JSON.stringify(exportToStructuredJSON(updated), null, 2);
  const diff = diffLines(JSON.stringify(exportToStructuredJSON(original), null, 2), updatedJson);

  if (!diff) {
    return (
      <div className="max-h-48 overflow-y-auto rounded border border-border/40 bg-muted/20 p-2 font-mono text-[11px]">
        <p className="mb-1 text-muted-foreground">Too large to diff. Showing the updated tool.</p>
        <pre className="whitespace-pre">{updatedJson}</pre>
      </div>
    );
  }

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
                  line.type === "added" && "bg-green-500/10 text-green-600 dark:text-green-400",
                  line.type === "removed" &&
                    "bg-red-500/10 text-red-500 line-through opacity-70 dark:text-red-400",
                  line.type === "same" && "text-muted-foreground",
                )}
              >
                {line.type === "added" ? "+ " : line.type === "removed" ? "- " : "  "}
                {line.text}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
