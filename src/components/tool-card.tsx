import { Tool } from "@/commandly/lib/types/flat";
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
import { Link } from "@tanstack/react-router";
import { Edit2Icon, ExternalLinkIcon, Trash2Icon } from "lucide-react";

export function ToolCard({
  tool,
  isLocal = false,
  onDelete,
}: {
  tool: Partial<Tool>;
  isLocal?: boolean;
  onDelete?: (tool: Partial<Tool>) => void;
}) {
  const description =
    tool.info?.description ?? (tool as Partial<Tool> & { description?: string }).description;

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
          {tool.info?.url && (
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
                  href={tool.info?.url}
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
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <CardContent className="flex min-h-0 flex-1 items-center justify-center px-2">
          {description ? (
            <HoverCard openDelay={300}>
              <HoverCardTrigger asChild>
                <p className="line-clamp-4 cursor-pointer text-center dark:text-foreground/60">
                  {description}
                </p>
              </HoverCardTrigger>
              <HoverCardContent className="max-w-xs text-sm">{description}</HoverCardContent>
            </HoverCard>
          ) : (
            <p className="text-sm text-muted-foreground">No description available</p>
          )}
        </CardContent>
        <CardFooter className="mt-auto flex w-full justify-center gap-2">
          <Button className="flex-1 hover:cursor-pointer">Go</Button>
        </CardFooter>
      </Link>
    </Card>
  );
}
