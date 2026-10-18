import { JsonTree } from "@/components/commandly/json-tree";
import { Tool } from "@/components/commandly/types/tool";
import { writeClipboard } from "@/components/commandly/utils/clipboard";
import { collapseUnchanged, diffLines, type DiffLineType } from "@/components/commandly/utils/diff";
import { exportToStructuredJSON } from "@/components/commandly/utils/tool-file";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CopyIcon, Edit2Icon, XIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface JsonOutputProps {
  tool: Tool;
  originalTool?: Tool;
  onApply?: (tool: Tool) => void;
}

/** The gutter marker for each kind of diff line. */
const DIFF_MARKER: Record<DiffLineType, string> = { same: "  ", added: "+ ", removed: "- " };

/** The row tones for each kind of diff line. */
const DIFF_TONE: Record<DiffLineType, string> = {
  same: "text-foreground/80",
  added: "bg-green-500/10 text-green-700 dark:text-green-400",
  removed: "bg-red-500/10 text-red-700 dark:text-red-400",
};

export function JsonOutput({ tool, originalTool, onApply }: JsonOutputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [showDiff, setShowDiff] = useState(true);

  const jsonString = useMemo(() => JSON.stringify(exportToStructuredJSON(tool), null, 2), [tool]);
  const originalJsonString = useMemo(
    () =>
      originalTool ? JSON.stringify(exportToStructuredJSON(originalTool), null, 2) : undefined,
    [originalTool],
  );
  const data = useMemo(() => JSON.parse(jsonString) as unknown, [jsonString]);

  const diff = useMemo(() => {
    if (!originalJsonString || originalJsonString === jsonString) return null;
    return collapseUnchanged(diffLines(originalJsonString, jsonString));
  }, [originalJsonString, jsonString]);

  const diffStats = useMemo(() => {
    if (!diff) return null;
    const added = diff.filter((l) => l.type === "added").length;
    const removed = diff.filter((l) => l.type === "removed").length;
    return { added, removed };
  }, [diff]);

  const handleEditToggle = () => {
    setEditValue(jsonString);
    setIsEditing(true);
  };

  const handleApply = () => {
    if (!onApply) return;
    try {
      const parsed = JSON.parse(editValue) as Tool;
      onApply(parsed);
      setIsEditing(false);
    } catch {
      toast.error("Invalid JSON", { description: "Please fix the JSON before applying." });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue("");
  };

  return (
    <Card className="max-w-full">
      <CardHeader className="gap-4">
        <CardTitle className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
            <span className="text-sm text-muted-foreground">
              Structured JSON output for this tool.
            </span>
          </div>
        </CardTitle>
        <div className="flex shrink-0 items-center gap-3 self-start sm:self-auto">
          {onApply && !isEditing && (
            <CardAction
              className="rounded-md"
              onClick={handleEditToggle}
            >
              <Edit2Icon className="h-4 w-4 dark:stroke-primary" />
            </CardAction>
          )}
          {onApply && isEditing && (
            <CardAction
              className="rounded-md"
              onClick={handleCancel}
            >
              <XIcon className="h-4 w-4 dark:stroke-primary" />
            </CardAction>
          )}
          <CardAction
            className="rounded-md"
            onClick={() => {
              writeClipboard(jsonString).then(
                () => toast("Copied!"),
                () => toast.error("Copy failed"),
              );
            }}
          >
            <CopyIcon className="h-4 w-4 dark:stroke-primary" />
          </CardAction>
        </div>
      </CardHeader>
      <CardContent>
        {diffStats && !isEditing && (
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {diffStats.added > 0 && (
              <Badge
                variant="outline"
                className="border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-400"
              >
                +{diffStats.added} added
              </Badge>
            )}
            {diffStats.removed > 0 && (
              <Badge
                variant="outline"
                className="border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400"
              >
                -{diffStats.removed} removed
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs sm:ml-auto"
              onClick={() => setShowDiff((v) => !v)}
            >
              {showDiff ? "Full view" : "Diff view"}
            </Button>
          </div>
        )}
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <ScrollArea
              className="max-w-full *:data-radix-scroll-area-viewport:max-h-[calc(100vh-360px)]"
              type="hover"
            >
              <Textarea
                className="min-h-80 font-mono text-sm sm:min-h-[calc(100vh-400px)]"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                spellCheck={false}
              />
              <ScrollBar orientation="vertical" />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleApply}
              >
                Apply
              </Button>
            </div>
          </div>
        ) : diff && showDiff ? (
          <ScrollArea
            className="max-w-full *:data-radix-scroll-area-viewport:max-h-[calc(100vh-320px)]"
            type="hover"
          >
            <pre className="w-fit min-w-full rounded-md font-mono text-sm whitespace-pre">
              {diff.map((row, idx) =>
                row.type === "gap" ? (
                  <div
                    key={idx}
                    className="px-1 text-muted-foreground/70"
                  >
                    … {row.count} unchanged {row.count === 1 ? "line" : "lines"}
                  </div>
                ) : (
                  <div
                    key={idx}
                    className={cn("px-1", DIFF_TONE[row.type])}
                  >
                    <span className="opacity-50 select-none">{DIFF_MARKER[row.type]}</span>
                    {row.text}
                  </div>
                ),
              )}
            </pre>
            <ScrollBar orientation="vertical" />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        ) : (
          <JsonTree data={data} />
        )}
      </CardContent>
    </Card>
  );
}
