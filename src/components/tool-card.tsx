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
import { Edit2Icon } from "lucide-react";

export function ToolCard({
  tool,
  isLocal = false
}: {
  tool: Partial<Tool>;
  isLocal?: boolean;
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
    <Card
      className="hover:shadow-md cursor-pointer w-72 h-72 flex flex-col gap-0 py-3"
      onClick={handleClick}
    >
      <CardHeader className="border-b [.border-b]:pb-0 pb-0 items-center align-top">
        <CardTitle className="font-semibold text-center">
          {tool.displayName}
        </CardTitle>
        <CardAction className="flex items-center align-top">
          <Button variant="link" size="icon" asChild>
            <Link
              to="/tools/$toolName/edit"
              params={{ toolName: tool.name!! }}
              {...(isLocal ? { search: { newTool: tool.name } } : {})}
            >
              <Edit2Icon className="size-4" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 flex-1 justify-between align-top mb-4">
        <p className="text-secondary-foreground">{tool.description}</p>
        <div className="flex flex-wrap gap-2 justify-center relative z-10">
          {supportedIO &&
            supportedIO.map((type) => (
              <Badge key={type} variant="secondary" className="text-xs">
                {type}
              </Badge>
            ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-center gap-2 w-full mt-auto">
        <Button className="flex-1" variant="outline" asChild>
          <Link
            to="/tools/$toolName/edit"
            params={{ toolName: tool.name!! }}
            {...(isLocal ? { search: { newTool: tool.name } } : {})}
          >
            Edit
          </Link>
        </Button>
        <Button className="flex-1" asChild>
          <Link
            to="/tools/$toolName"
            params={{ toolName: tool.name! }}
            {...(isLocal ? { search: { newTool: tool.name } } : {})}
          >
            View
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
