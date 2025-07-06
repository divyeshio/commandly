import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tool } from "@/registry/commandly/lib/types/commandly";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { Edit2Icon, Trash2Icon } from "lucide-react";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent
} from "@/components/ui/hover-card";
import { useRef, useEffect, useState } from "react";

export function ToolCard({
  tool,
  isLocal = false,
  onDelete
}: {
  tool: Partial<Tool>;
  isLocal?: boolean;
  onDelete?: (tool: Partial<Tool>) => void;
}) {
  const supportedIO = [...tool.supportedInput!, ...tool.supportedOutput!];
  const navigation = useNavigate();
  const descRef = useRef<HTMLParagraphElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const el = descRef.current;
    if (el) {
      setIsOverflowing(
        el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth
      );
    }
  }, [tool.description]);

  const handleClick = () => {
    navigation({
      to: "/tools/$toolName",
      params: { toolName: tool.name!! },
      search: isLocal ? { newTool: tool.name } : {}
    });
  };

  return (
    <Card
      className="hover:shadow-md  w-72 h-72 flex flex-col gap-0 py-3"
      style={{
        viewTransitionName: `tool-card-${tool.name}`
      }}
    >
      <CardHeader className="border-b [.border-b]:pb-1 flex items-center justify-between">
        <CardTitle className="font-semibold">
          <span
            style={{
              viewTransitionName: `tool-card-title-${tool.name}`
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
              params={{ toolName: tool.name!! }}
              {...(isLocal ? { search: { newTool: tool.name } } : {})}
            >
              <Edit2Icon className="size-4" />
            </Link>
          </Button>
          {isLocal && (
            <Button
              size="icon"
              variant="link"
              className="text-foreground dark:text-primary cursor-pointer"
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
      <CardContent onClick={handleClick} className="px-2">
        <div className="flex flex-col gap-4 align-top mb-6 cursor-pointer h-full">
          <div className="w-full flex-1 flex items-center justify-center py-1">
            {tool.description ? (
              isOverflowing ? (
                <HoverCard openDelay={0}>
                  <HoverCardTrigger asChild>
                    <p className="p-1 line-clamp-4 overflow-ellipsis text-justify cursor-pointer dark:text-foreground/60">
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
                  className="p-1 line-clamp-4 overflow-ellipsis text-center dark:text-foreground/60"
                >
                  {tool.description}
                </p>
              )
            ) : (
              <p className="text-muted">No description available</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 justify-center relative z-10 mt-auto">
            {supportedIO &&
              supportedIO.map((type) => (
                <Badge key={type} variant="secondary" className="text-xs">
                  {type}
                </Badge>
              ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center gap-2 w-full mt-auto">
        <Button className="flex-1" asChild>
          <Link
            preload="viewport"
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
