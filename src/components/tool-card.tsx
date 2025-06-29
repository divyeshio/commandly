import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, ScanIcon, PencilIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tool } from "@/lib/types/tool-editor";
import { Link } from "@tanstack/react-router";

export function ToolCard({
  tool,
  isSelected = false,
  isLocal = false
}: {
  tool: Partial<Tool>;
  isSelected?: boolean;
  isLocal?: boolean;
}) {
  const supportedIO = [...tool.supportedInput!, ...tool.supportedOutput!];

  return (
    <Card
      className={cn(
        "group hover:shadow-md transition-all duration-200 hover:-translate-y-1 cursor-pointer relative overflow-hidden w-80 h-96",
        isSelected && "ring-2 ring-primary"
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-background/60 backdrop-blur-[1px] opacity-0 transition-opacity duration-200",
          isSelected && "opacity-100"
        )}
      />
      <CardContent className="p-6 flex flex-col items-center justify-center gap-4 relative">
        <div
          className={cn(
            "text-4xl text-muted-foreground transition-colors",
            isSelected ? "text-primary" : "group-hover:text-primary"
          )}
        >
          <ScanIcon />
        </div>
        <div className="text-lg font-semibold text-center relative z-10">
          {tool.displayName}
        </div>
        <div className="flex flex-wrap gap-2 justify-center relative z-10">
          {supportedIO &&
            supportedIO.map((type) => (
              <Badge key={type} variant="secondary" className="text-xs">
                {type}
              </Badge>
            ))}
        </div>
        {tool.name && (
          <Link
            to="/tools/$toolName/edit"
            params={{ toolName: tool.name }}
            className="absolute top-4 right-4 z-20 text-muted-foreground hover:text-primary transition-colors"
            tabIndex={-1}
            aria-label={`Edit ${tool.displayName}`}
            {...(isLocal ? { search: { newTool: tool.name } } : {})}
            onClick={(e) => e.stopPropagation()}
          >
            <PencilIcon className="w-4 h-4" />
          </Link>
        )}
        <div
          className={cn(
            "absolute bottom-4 left-1/2 -translate-x-1/2 transform opacity-0 transition-all duration-200",
            isSelected && "opacity-100"
          )}
        >
          <div className="bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg">
            <CheckIcon className="w-4 h-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
