import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2Icon, Wand2Icon } from "lucide-react";
import { createOpenAI } from "@ai-sdk/openai";
import z from "zod/v4";
import { generateSystemPrompt } from "@/components/tool-editor-ui/prompt";
import { streamText } from "ai";
import { Tool, ToolSchema } from "@/registry/commandly/lib/types/commandly";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { Checkbox } from "@/components/ui/checkbox";

export function AIParsing({
  onParseCompleted
}: {
  onParseCompleted: (tool: Tool | null) => void;
}) {
  const [helpText, setHelpText] = useState("");
  const [json, setJson] = useState("");
  const [model, setModel] = useState("");
  const [isParsingHelp, setIsParsingHelp] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const scrollRef = useRef<HTMLTextAreaElement>(null);
  const [parseCount, setParseCount] = useState(0);
  const [isUserTouched, setIsUserTouched] = useState(false);
  const [savedKey, setSavedKey] = useState<boolean>(false);

  useEffect(() => {
    onParseCompleted(null);
  }, [onParseCompleted]);

  useEffect(() => {
    const savedApiKey = localStorage.getItem("ai-api-key");
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setSavedKey(true);
    }
  }, []);

  const parseHelpWithAI = async () => {
    if (!helpText.trim()) {
      return;
    }
    setJson("");
    setParseCount((prev) => prev + 1);
    setIsUserTouched(false);
    setIsParsingHelp(true);
    try {
      const openai = createOpenAI({ apiKey: apiKey });
      const jsonSchema = z.toJSONSchema(ToolSchema);
      const systemPrompt = generateSystemPrompt(
        helpText,
        JSON.stringify(jsonSchema, null, 2)
      );

      const { textStream } = streamText({
        model: openai(model),
        prompt: systemPrompt,
        onFinish({ text }) {
          validateJson(text);
        }
      });

      for await (const text of textStream) {
        setJson((prev) => prev + text);
        scrollRef.current!.scrollTop = scrollRef.current!.scrollHeight;
      }
    } catch (error) {
      console.error("Error with AI parsing:", error);
      setJson("");
    }
    setIsParsingHelp(false);
  };

  const validateJson = (jsonString: string) => {
    try {
      const parsedTool = ToolSchema.parse(JSON.parse(jsonString));
      setJson(JSON.stringify(parsedTool, null, 2));
      onParseCompleted(parsedTool);
    } catch (error) {
      console.error("Error parsing JSON:", error);
      onParseCompleted(null);
      if (error instanceof z.ZodError) {
        toast.error(`Invalid JSON: ${error.name}. Please check the format.`, {
          description: z.prettifyError(error),
          duration: 5000
        });
      } else {
        toast.error("Failed to parse JSON. Please check the format.");
      }
    }
  };
  const [debouncedQuery] = useDebouncedValue(json, {
    wait: 2000,
    enabled: isUserTouched
  });

  useEffect(() => {
    if (json && isUserTouched) {
      validateJson(debouncedQuery);
    }
  }, [debouncedQuery, isUserTouched]);

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Label htmlFor="ai-model">Model</Label>
        <Select onValueChange={setModel}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gpt-4.1-2025-04-14">GPT 4.1</SelectItem>
            <SelectItem value="gpt-4.1-mini-2025-04-14">
              GPT 4.1 Mini
            </SelectItem>
            <SelectItem value="o4-mini-2025-04-16">o4-mini</SelectItem>
          </SelectContent>
        </Select>
        <Label htmlFor="ai-key">Key</Label>
        <Input
          id="ai-key"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <Label htmlFor="save-ai-key">Save</Label>
          <Checkbox
            id="save-ai-key"
            checked={savedKey}
            onCheckedChange={(checked) => {
              const save = checked == "indeterminate" ? false : checked;
              if (save && apiKey.trim() !== "") {
                localStorage.setItem("ai-api-key", apiKey);
              } else {
                localStorage.removeItem("ai-api-key");
              }
              setSavedKey(save);
            }}
          />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <Label htmlFor="help-text">Help Text Output</Label>
        <ScrollArea className="box-border w-full rounded-lg border border-input bg-background ring-offset-background focus-within:ring-1 focus-within:ring-ring min-h-[30dvh] min-w-2xl max-h-[35dvh]">
          <Textarea
            className="min-h-[30dvh] min-w-2xl max-h-[30dvh]"
            id="help-text"
            value={helpText}
            onChange={(e) => setHelpText(e.target.value)}
            placeholder="Paste the output of 'your-tool --help' here..."
            rows={30}
          />
        </ScrollArea>
        <Label htmlFor="parsed-json">Parsed JSON</Label>
        <ScrollArea className="box-border w-full rounded-lg border border-input bg-background ring-offset-background focus-within:ring-1 focus-within:ring-ring min-h-[30dvh] min-w-2xl max-h-[35dvh]">
          <Textarea
            className="min-h-[30dvh] min-w-2xl max-h-[30dvh]"
            id="parsed-json"
            ref={scrollRef}
            value={json}
            readOnly={isParsingHelp}
            onChange={(e) => {
              setJson(e.target.value);
              setIsUserTouched(true);
            }}
            rows={30}
          />
        </ScrollArea>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={parseHelpWithAI}
          disabled={
            isParsingHelp || helpText === "" || model === "" || apiKey === ""
          }
          className="flex-1"
        >
          {isParsingHelp ? (
            <>
              <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
              Parsing with AI...
            </>
          ) : (
            <>
              <Wand2Icon className="h-4 w-4 mr-2" />
              Parse with AI
            </>
          )}
        </Button>
        {parseCount > 0 && (
          <Button
            disabled={isParsingHelp || !isUserTouched}
            onClick={() => validateJson(json)}
          >
            Re-validate
          </Button>
        )}
      </div>
    </div>
  );
}
