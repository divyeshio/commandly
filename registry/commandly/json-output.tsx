import { Tool } from "@/components/commandly/types/flat";
import { exportToStructuredJSON } from "@/components/commandly/utils/flat";
import { convertToNestedStructure } from "@/components/commandly/utils/nested";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command as UICommand,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CheckIcon, ChevronsUpDownIcon, CopyIcon, Edit2Icon, XIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const jsonOptions = [
  { value: "nested", label: "Nested" },
  { value: "flat", label: "Flat" },
];

type DiffLine = { type: "same" | "added" | "removed"; text: string };

function diffLines(before: string, after: string): DiffLine[] {
  const a = before.split("\n");
  const b = after.split("\n");
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] =
        a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  const result: DiffLine[] = [];
  let i = m,
    j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      result.unshift({ type: "same", text: a[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: "added", text: b[j - 1] });
      j--;
    } else {
      result.unshift({ type: "removed", text: a[i - 1] });
      i--;
    }
  }
  return result;
}

interface JsonTypeComponentProps {
  tool: Tool;
  originalTool?: Tool;
  onApply?: (tool: Tool) => void;
}

export function JsonOutput({ tool, originalTool, onApply }: JsonTypeComponentProps) {
  const [open, setOpen] = useState(false);
  const [jsonString, setJsonString] = useState<string>();
  const [originalJsonString, setOriginalJsonString] = useState<string>();
  const [jsonType, setJsonType] = useState<"nested" | "flat">("flat");
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [showDiff, setShowDiff] = useState(true);

  useEffect(() => {
    const config =
      jsonType === "flat" ? exportToStructuredJSON(tool) : convertToNestedStructure(tool);
    setJsonString(JSON.stringify(config, null, 2));
  }, [jsonType, tool]);

  useEffect(() => {
    if (!originalTool) {
      setOriginalJsonString(undefined);
      return;
    }
    const config =
      jsonType === "flat"
        ? exportToStructuredJSON(originalTool)
        : convertToNestedStructure(originalTool);
    setOriginalJsonString(JSON.stringify(config, null, 2));
  }, [jsonType, originalTool]);

  const diff = useMemo(() => {
    if (!originalJsonString || !jsonString || originalJsonString === jsonString) return null;
    return diffLines(originalJsonString, jsonString);
  }, [originalJsonString, jsonString]);

  const diffStats = useMemo(() => {
    if (!diff) return null;
    const added = diff.filter((l) => l.type === "added").length;
    const removed = diff.filter((l) => l.type === "removed").length;
    return { added, removed };
  }, [diff]);

  const handleEditToggle = () => {
    setEditValue(jsonString ?? "");
    setIsEditing(true);
  };

  const handleApply = () => {
    try {
      const parsed = JSON.parse(editValue) as Tool;
      onApply!(parsed);
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
            <span className="text-sm">Output type:</span>
            <Popover
              open={open}
              onOpenChange={setOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full min-w-0 justify-between sm:w-48"
                >
                  {jsonOptions.find((option) => option.value === jsonType)?.label}
                  <ChevronsUpDownIcon className="opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-(--radix-popover-trigger-width) min-w-40 p-0 sm:w-48">
                <UICommand>
                  <CommandList>
                    <CommandGroup>
                      {jsonOptions.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          onSelect={(currentValue) => {
                            setJsonType(currentValue as "nested" | "flat");
                            setOpen(false);
                          }}
                        >
                          {option.label}
                          <CheckIcon
                            className={cn(
                              "ml-auto h-4 w-4",
                              jsonType === option.value ? "opacity-100" : "opacity-0",
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </UICommand>
              </PopoverContent>
            </Popover>
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
              navigator.clipboard.writeText(jsonString!);
              toast("Copied!");
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
              {diff.map((line, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "px-1",
                    line.type === "added" && "bg-green-500/10 text-green-700 dark:text-green-400",
                    line.type === "removed" && "bg-red-500/10 text-red-700 dark:text-red-400",
                    line.type === "same" && "text-foreground/80",
                  )}
                >
                  <span className="opacity-50 select-none">
                    {line.type === "added" ? "+ " : line.type === "removed" ? "- " : "  "}
                  </span>
                  {line.text}
                </div>
              ))}
            </pre>
            <ScrollBar orientation="vertical" />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        ) : (
          <ScrollArea
            className="max-w-full *:data-radix-scroll-area-viewport:max-h-[calc(100vh-320px)]"
            type="hover"
          >
            <pre className="w-fit min-w-full rounded-md bg-card font-mono text-sm whitespace-pre dark:text-gray-200">
              {jsonString}
            </pre>
            <ScrollBar orientation="vertical" />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
