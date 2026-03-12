import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Tool } from "@/registry/commandly/lib/types/commandly";
import { Link } from "@tanstack/react-router";
import { Edit2Icon, ExternalLinkIcon, Trash2Icon } from "lucide-react";
import { useRef, useEffect, useState } from "react";

export function ToolCard({
  tool,
  isLocal = false,
  onDelete,
}: {
  tool: Partial<Tool>;
  isLocal?: boolean;
  onDelete?: (tool: Partial<Tool>) => void;
}) {
  const descRef = useRef<HTMLParagraphElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const el = descRef.current;
    if (el) {
      setIsOverflowing(el.scrollHeight > el.clientHeight + 1);
    }
  }, [tool.description]);

  return (
    <Card
      className="flex h-72 w-72 flex-col gap-0 overflow-hidden py-3 hover:shadow-md"
      style={{
        viewTransitionName: `tool-card-${tool.name}`,
      }}
    >
      <CardHeader className="flex items-center justify-between border-b [.border-b]:pb-1">
        <CardTitle className="font-semibold">
          <span
            className="font-mono"
            style={{
              viewTransitionName: `tool-card-title-${tool.name}`,
            }}
          >
            {tool.displayName}
          </span>
        </CardTitle>
        <div className="flex gap-1">
          {tool.url && (
            <CardAction>
              <Button
                asChild
                className="text-foreground"
                size="icon"
                variant="link"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <a
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLinkIcon />
                </a>
              </Button>
            </CardAction>
          )}
          <CardAction>
            <Button
              variant="link"
              size="icon"
              asChild
            >
              <Link
                to="/tools/$toolName/edit"
                params={{ toolName: tool.name! }}
                search={{ isNew: false, isLocal: isLocal }}
              >
                <Edit2Icon className="size-4" />
              </Link>
            </Button>
            {isLocal && (
              <Button
                size="icon"
                variant="link"
                className="cursor-pointer text-foreground dark:text-primary"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete?.(tool);
                }}
              >
                <Trash2Icon className="size-4" />
              </Button>
            )}
          </CardAction>
        </div>
      </CardHeader>
      <Link
        to="/tools/$toolName"
        params={{ toolName: tool.name! }}
        search={{ newTool: isLocal ? tool.name : undefined }}
        preload="intent"
        className="flex h-72 w-72 flex-col gap-0 overflow-hidden py-3"
      >
        <CardContent className="min-h-0 flex-1 px-2">
          <div className="mb-6 flex h-full min-h-0 cursor-pointer flex-col gap-4 align-top">
            <div className="flex w-full flex-1 items-center justify-center py-1">
              {tool.description ? (
                isOverflowing ? (
                  <HoverCard openDelay={0}>
                    <HoverCardTrigger asChild>
                      <p className="line-clamp-4 cursor-pointer p-1 text-justify overflow-ellipsis dark:text-foreground/60">
                        {tool.description}
                      </p>
                    </HoverCardTrigger>
                    <HoverCardContent className="max-w-xs text-sm">
                      {tool.description}
                    </HoverCardContent>
                  </HoverCard>
                ) : (
                  <p
                    ref={descRef}
                    className="line-clamp-4 p-1 text-center overflow-ellipsis dark:text-foreground/60"
                  >
                    {tool.description}
                  </p>
                )
              ) : (
                <p className="text-muted">No description available</p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="mt-auto flex w-full justify-center gap-2">
          <Button className="flex-1 hover:cursor-pointer">Go</Button>
        </CardFooter>
      </Link>
    </Card>
  );
}
