import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckIcon, ChevronsUpDownIcon, CopyIcon } from "lucide-react";
import { cn } from "@lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Command as UICommand,
  CommandGroup,
  CommandItem,
  CommandList
} from "../ui/command";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle
} from "../ui/card";
import { exportToStructuredJSON } from "@lib/utils/tool-editor";
import { convertToNestedStructure } from "@lib/utils/tool-editor-nested";
import { Tool } from "@lib/types/tool-editor";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { toast } from "sonner";
import { useQueryState } from "nuqs";

const jsonOptions = [
  { value: "nested", label: "Nested" },
  { value: "flat", label: "Flat" }
];

interface JsonTypeComponentProps {
  tool: Tool;
}

export function JsonOutput({ tool }: JsonTypeComponentProps) {
  const [open, setOpen] = useState(false);
  const [jsonString, setJsonString] = useState<string>();
  const [jsonType, setJsonType] = useQueryState("output", {
    defaultValue: "flat"
  });
  useEffect(() => {
    const config =
      jsonType === "flat"
        ? exportToStructuredJSON(tool)
        : convertToNestedStructure(tool);
    setJsonString(JSON.stringify(config, null, 2));
  }, [jsonType, tool]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="text-sm">Output type: </span>
          <Popover open={open} onOpenChange={setOpen}>
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
                          setJsonType(currentValue);
                          setOpen(false);
                        }}
                      >
                        {option.label}
                        <CheckIcon
                          className={cn(
                            "ml-auto h-4 w-4",
                            jsonType === option.value
                              ? "opacity-100"
                              : "opacity-0"
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
        <CardAction
          className="bg-sidebar-accent rounded-md"
          onClick={() => {
            navigator.clipboard.writeText(jsonString!);
            toast("Copied!");
          }}
        >
          <CopyIcon className="h-4 w-4 dark:stroke-primary" />
        </CardAction>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[60svh] max-w-full" type="hover">
          <pre className="rounded-md text-sm font-mono bg-card dark:text-gray-200 max-h-[60svh] max-w-full">
            {jsonString}
          </pre>
          <ScrollBar orientation="vertical" />
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
