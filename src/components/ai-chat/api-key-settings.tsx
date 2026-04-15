import { MODEL_GROUPS } from "./model-picker";
import { type AIProvider } from "@/lib/ai-keys";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { CheckIcon, EyeIcon, EyeOffIcon, GlobeIcon, Settings2Icon } from "lucide-react";
import { useState } from "react";

interface AIKeyState {
    key: string;
    setKey: (key: string) => void;
    isSaved: boolean;
    setSaved: (saved: boolean) => void;
}

interface ApiKeySettingsProps {
    allProviderKeys: Record<Exclude<AIProvider, "tavily">, AIKeyState>;
    tavilyKeys: AIKeyState;
}

export function ApiKeySettings({ allProviderKeys, tavilyKeys }: ApiKeySettingsProps) {
    const [revealed, setRevealed] = useState<Record<string, boolean>>({});

    const toggleReveal = (key: string) =>
        setRevealed((prev) => ({ ...prev, [key]: !prev[key] }));
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                >
                    <Settings2Icon className="h-3.5 w-3.5" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-80"
                side="bottom"
                align="end"
            >
                <p className="mb-3 text-sm font-medium">API Keys</p>
                <div className="flex max-h-72 flex-col gap-4 overflow-y-auto pr-1">
                    {MODEL_GROUPS.map((g, gi) => {
                        const keys = allProviderKeys[g.provider as Exclude<AIProvider, "tavily">];
                        return (
                            <div key={g.provider}>
                                {gi > 0 && <Separator className="mb-4" />}
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-1.5">
                                        <img
                                            src={g.logoUrl}
                                            alt={g.label}
                                            className="h-4 w-4 rounded"
                                        />
                                        <span className="text-xs font-medium">{g.label}</span>
                                        {keys.isSaved && <CheckIcon className="ml-auto h-3 w-3 text-green-600" />}
                                    </div>
                                    <div className="relative">
                                    <Input
                                        type={revealed[g.provider] ? "text" : "password"}
                                        value={keys.key}
                                        onChange={(e) => keys.setKey(e.target.value)}
                                        className="h-8 pr-8 text-xs"
                                        placeholder={g.keyPlaceholder}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        onClick={() => toggleReveal(g.provider)}
                                        tabIndex={-1}
                                        aria-label={revealed[g.provider] ? "Hide key" : "Reveal key"}
                                    >
                                        {revealed[g.provider]
                                            ? <EyeOffIcon className="h-3.5 w-3.5" />
                                            : <EyeIcon className="h-3.5 w-3.5" />}
                                    </button>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Checkbox
                                            id={`${g.provider}-save-key`}
                                            checked={keys.isSaved}
                                            onCheckedChange={(c) => keys.setSaved(c === "indeterminate" ? false : c)}
                                        />
                                        <Label
                                            htmlFor={`${g.provider}-save-key`}
                                            className="cursor-pointer text-xs"
                                        >
                                            Save key locally
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <Separator />
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1.5">
                            <GlobeIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-medium">Tavily (Web Search)</span>
                            {tavilyKeys.isSaved && <CheckIcon className="ml-auto h-3 w-3 text-green-600" />}
                        </div>
                        <div className="relative">
                        <Input
                            type={revealed["tavily"] ? "text" : "password"}
                            value={tavilyKeys.key}
                            onChange={(e) => tavilyKeys.setKey(e.target.value)}
                            className="h-8 pr-8 text-xs"
                            placeholder="tvly-..."
                        />
                        <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => toggleReveal("tavily")}
                            tabIndex={-1}
                            aria-label={revealed["tavily"] ? "Hide key" : "Reveal key"}
                        >
                            {revealed["tavily"]
                                ? <EyeOffIcon className="h-3.5 w-3.5" />
                                : <EyeIcon className="h-3.5 w-3.5" />}
                        </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Checkbox
                                id="tavily-save-key"
                                checked={tavilyKeys.isSaved}
                                onCheckedChange={(c) => tavilyKeys.setSaved(c === "indeterminate" ? false : c)}
                            />
                            <Label
                                htmlFor="tavily-save-key"
                                className="cursor-pointer text-xs"
                            >
                                Save key locally
                            </Label>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
