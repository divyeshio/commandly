import { useState } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Loader2Icon, Wand2Icon } from "lucide-react";
import { createOpenAI } from "@ai-sdk/openai";
import z from "zod/v4";
import { generateSystemPrompt } from "@/lib/prompt";
import { generateText } from "ai";
import { ToolSchema } from "@/lib/types/tool-editor";

export function AIParsing() {
  const [helpText, setHelpText] = useState("");
  const [json, setJson] = useState("");
  const [model, setModel] = useState("");
  const [isParsingHelp, setIsParsingHelp] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const parseHelpWithAI = async () => {
    if (!helpText.trim()) {
      return;
    }

    setIsParsingHelp(true);
    try {
      const openai = createOpenAI({ apiKey: apiKey });

      const jsonSchema = z.toJSONSchema(ToolSchema);

      const systemPrompt = generateSystemPrompt(
        helpText,
        JSON.stringify(jsonSchema, null, 2)
      );

      const { text } = await generateText({
        model: openai(model),
        prompt: systemPrompt
      });
      setJson(text);
    } catch (error) {
      console.error("Error parsing help text:", error);
    }
    setIsParsingHelp(false);
  };
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Label htmlFor="ai-model">Model</Label>
        <Input
          id="ai-model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        />
        <Label htmlFor="ai-key">Key</Label>
        <Input
          id="ai-key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
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
            value={json}
            onChange={(e) => setJson(e.target.value)}
            rows={30}
          />
        </ScrollArea>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={parseHelpWithAI}
          disabled={isParsingHelp}
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
      </div>
    </div>
  );
}
