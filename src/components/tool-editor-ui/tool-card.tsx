import { Badge } from "@/components/ui/badge";
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
import { Edit2Icon, Trash2Icon } from "lucide-react";
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
  const supportedIO = [...tool.supportedInput!, ...tool.supportedOutput!];
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
            style={{
              viewTransitionName: `tool-card-title-${tool.name}`,
            }}
          >
            {tool.displayName}
          </span>
        </CardTitle>
        <CardAction>
          <Button
            variant="link"
            size="icon"
            className="text-foreground dark:text-primary"
            asChild
          >
            <Link
              to="/tools/$toolName/edit"
              params={{ toolName: tool.name! }}
              {...(isLocal ? { search: { newTool: tool.name } } : {})}
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
      </CardHeader>
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

          <div className="relative z-10 mt-auto mb-4 flex w-full flex-wrap justify-center gap-2">
            {supportedIO &&
              supportedIO.map((type) => (
                <Badge
                  key={type}
                  variant="secondary"
                  className="text-xs"
                >
                  {type}
                </Badge>
              ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="mt-auto flex w-full justify-center gap-2">
        <Button
          className="flex-1"
          asChild
        >
          <Link
            preload="intent"
            to="/tools/$toolName"
            params={{ toolName: tool.name! }}
            {...(isLocal ? { search: { newTool: tool.name } } : {})}
          >
            Go
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
