import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { CheckIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "./ui/command";
import { Badge } from "./ui/badge";

export interface TagsProps {
  tags: string[];
  id: string;
  maxCount?: number;
  onOpenChange?: (isOpen: boolean, tags: string[]) => void;
}

export const TagsComponent = ({
  tags: initialTags,
  maxCount = 3,
  onOpenChange
}: TagsProps) => {
  const [tags, setTags] = useState(initialTags);
  const [searchValue, setSearchValue] = useState("");

  const visibleTags = tags?.length ? tags.slice(0, maxCount) : [];
  const remainingCount = tags?.length ? Math.max(0, tags.length - maxCount) : 0;

  const handleLabelToggle = (value: string) => {
    setTags((items) => {
      if (items.includes(value)) {
        return items.filter((item) => item !== value);
      }
      return [...items, value];
    });
  };

  return (
    <div
      className="flex items-center space-x-1"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {visibleTags.map((label) => (
        <Button
          key={label}
          variant="outline"
          size="sm"
          className="justify-start"
        >
          {label}
        </Button>
      ))}
      <Popover onOpenChange={(isOpen) => onOpenChange?.(isOpen, tags)}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="justify-start">
            {remainingCount > 0 ? (
              `+ ${remainingCount} more`
            ) : (
              <>
                <PlusIcon /> Add Tags
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 max-w-48" side="right" align="start">
          <Command>
            <CommandInput
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchValue) {
                  setTags((prev) => [...prev, searchValue]);
                  setSearchValue("");
                }
              }}
              onValueChange={(value) => setSearchValue(value)}
              value={searchValue}
              placeholder="Search tags..."
            />
            <CommandList>
              <CommandEmpty>
                <div className="flex flex-col items-center justify-center">
                  <p className="p-2">
                    No results found. Press
                    <kbd className="pointer-events-none inline-flex select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                      <span className="text-xs">⌘</span>Enter
                    </kbd>
                    to create
                  </p>
                  <Badge
                    className="block cursor-pointer"
                    variant="outline"
                    onClick={() => {
                      setTags((prev) => [...prev, searchValue]);
                      setSearchValue("");
                    }}
                  >
                    {searchValue}
                  </Badge>
                </div>
              </CommandEmpty>
              <CommandGroup>
                {tags?.length > 0 &&
                  tags.map((tag) => (
                    <CommandItem
                      key={tag}
                      value={tag}
                      onSelect={handleLabelToggle}
                    >
                      <span>{tag}</span>
                      {tags.includes(tag) && <CheckIcon className="ml-auto" />}
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
