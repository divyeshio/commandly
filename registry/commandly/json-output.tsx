import { Tool } from "@/components/commandly/types/flat";
import { exportToStructuredJSON } from "@/components/commandly/utils/flat";
import { convertToNestedStructure } from "@/components/commandly/utils/nested";
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
import { useEffect, useState } from "react";
import { toast } from "sonner";

const jsonOptions = [
  { value: "nested", label: "Nested" },
  { value: "flat", label: "Flat" },
];

interface JsonTypeComponentProps {
  tool: Tool;
  onApply?: (tool: Tool) => void;
}

export function JsonOutput({ tool, onApply }: JsonTypeComponentProps) {
  const [open, setOpen] = useState(false);
  const [jsonString, setJsonString] = useState<string>();
  const [jsonType, setJsonType] = useState<"nested" | "flat">("flat");
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    const config =
      jsonType === "flat" ? exportToStructuredJSON(tool) : convertToNestedStructure(tool);
    setJsonString(JSON.stringify(config, null, 2));
  }, [jsonType, tool]);

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
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="text-sm">Output type: </span>
          <Popover
            open={open}
            onOpenChange={setOpen}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-48 justify-between"
              >
                {jsonOptions.find((option) => option.value === jsonType)?.label}
                <ChevronsUpDownIcon className="opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0">
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
        </CardTitle>
        <div className="flex gap-3">
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
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <ScrollArea
              className="max-w-full *:data-radix-scroll-area-viewport:max-h-[calc(100vh-360px)]"
              type="hover"
            >
              <Textarea
                className="min-h-[calc(100vh-400px)] font-mono text-sm"
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
        ) : (
          <ScrollArea
            className="max-w-full *:data-radix-scroll-area-viewport:max-h-[calc(100vh-320px)]"
            type="hover"
          >
            <pre className="max-h max-w-full rounded-md bg-card font-mono text-sm dark:text-gray-200">
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
