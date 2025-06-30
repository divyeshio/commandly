import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tool } from "@/lib/types/tool-editor";
import { Button } from "./ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { Edit2Icon, Trash2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const handleClick = () => {
    navigation({
      to: "/tools/$toolName",
      params: { toolName: tool.name!! },
      search: isLocal ? { newTool: tool.name } : {}
    });
  };

  return (
    <Card className="hover:shadow-md  w-72 h-72 flex flex-col gap-0 py-3">
      <CardHeader className="border-b [.border-b]:pb-1 flex items-center justify-between">
        <CardTitle className="font-semibold">{tool.displayName}</CardTitle>
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
      <CardContent
        className="flex flex-col items-center justify-center gap-4 flex-1 align-top mb-6 cursor-pointer"
        onClick={handleClick}
      >
        <p className="text-secondary-foreground p-2 text-center w-full flex-1 flex items-center justify-center">
          <span className={cn("", tool.description ? "" : "text-muted")}>
            {tool.description ? tool.description : "No description available"}
          </span>
        </p>
        <div className="flex flex-wrap gap-2 justify-center relative z-10 justify-self-end self-end">
          {supportedIO &&
            supportedIO.map((type) => (
              <Badge key={type} variant="secondary" className="text-xs">
                {type}
              </Badge>
            ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-center gap-2 w-full mt-auto">
        <Button className="flex-1" asChild>
          <Link
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
