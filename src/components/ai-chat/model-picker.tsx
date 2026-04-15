import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { type AIProvider } from "@/lib/ai-keys";
import { cn } from "@/lib/utils";
import { CheckIcon, ChevronsUpDownIcon, ChevronUpIcon } from "lucide-react";
import { useState } from "react";

interface AIKeyState {
  key: string;
  setKey: (key: string) => void;
  isSaved: boolean;
  setSaved: (saved: boolean) => void;
}

export const MODEL_GROUPS: {
  provider: AIProvider;
  label: string;
  logoUrl: string;
  keyPlaceholder: string;
  models: { value: string; label: string; reasoning?: true }[];
}[] = [
  {
    provider: "openai",
    label: "OpenAI",
    logoUrl: "https://www.google.com/s2/favicons?domain=openai.com&sz=32",
    keyPlaceholder: "sk-...",
    models: [
      { value: "gpt-5.4", label: "GPT-5.4", reasoning: true },
      { value: "gpt-5.4-pro", label: "GPT-5.4 pro", reasoning: true },
      { value: "gpt-5.4-mini", label: "GPT-5.4 mini", reasoning: true },
      { value: "gpt-5.4-nano", label: "GPT-5.4 nano", reasoning: true },
      { value: "gpt-5", label: "GPT-5", reasoning: true },
      { value: "gpt-5-pro", label: "GPT-5 pro", reasoning: true },
      { value: "gpt-5-mini", label: "GPT-5 mini", reasoning: true },
      { value: "gpt-5-nano", label: "GPT-5 nano", reasoning: true },
      { value: "gpt-5.2", label: "GPT-5.2", reasoning: true },
      { value: "gpt-5.2-pro", label: "GPT-5.2 pro", reasoning: true },
      { value: "gpt-5.1", label: "GPT-5.1", reasoning: true },
      { value: "gpt-4.1", label: "GPT-4.1" },
      { value: "gpt-4.1-mini", label: "GPT-4.1 mini" },
      { value: "gpt-4.1-nano", label: "GPT-4.1 nano" },
      { value: "o4-mini", label: "o4-mini", reasoning: true },
      { value: "o3", label: "o3", reasoning: true },
      { value: "o3-pro", label: "o3-pro", reasoning: true },
      { value: "o1-pro", label: "o1-pro", reasoning: true },
      { value: "gpt-5-codex", label: "GPT-5 Codex", reasoning: true },
      { value: "gpt-5.3-codex", label: "GPT-5.3 Codex", reasoning: true },
      { value: "gpt-5.2-codex", label: "GPT-5.2 Codex", reasoning: true },
      { value: "gpt-5.1-codex", label: "GPT-5.1 Codex", reasoning: true },
      { value: "gpt-5.1-codex-max", label: "GPT-5.1 Codex Max", reasoning: true },
      { value: "gpt-5.1-codex-mini", label: "GPT-5.1 Codex mini", reasoning: true },
    ],
  },
  {
    provider: "anthropic",
    label: "Anthropic",
    logoUrl: "https://www.google.com/s2/favicons?domain=anthropic.com&sz=32",
    keyPlaceholder: "sk-ant-...",
    models: [
      { value: "claude-opus-4-6", label: "Claude Opus 4.6", reasoning: true },
      { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", reasoning: true },
      { value: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
      { value: "claude-opus-4-5", label: "Claude Opus 4.5", reasoning: true },
      { value: "claude-sonnet-4-5", label: "Claude Sonnet 4.5", reasoning: true },
    ],
  },
  {
    provider: "google",
    label: "Google",
    logoUrl: "https://www.google.com/s2/favicons?domain=google.com&sz=32",
    keyPlaceholder: "AIza...",
    models: [
      { value: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro", reasoning: true },
      { value: "gemini-3-flash-preview", label: "Gemini 3 Flash", reasoning: true },
      { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro", reasoning: true },
      { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", reasoning: true },
      { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
    ],
  },
  {
    provider: "groq",
    label: "Groq",
    logoUrl: "https://www.google.com/s2/favicons?domain=groq.com&sz=32",
    keyPlaceholder: "gsk_...",
    models: [
      { value: "meta-llama/llama-4-maverick-17b-128e-instruct", label: "Llama 4 Maverick" },
      { value: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout" },
      { value: "qwen/qwen3-32b", label: "Qwen 3 32B" },
      { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
      { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B" },
    ],
  },
  {
    provider: "mistral",
    label: "Mistral",
    logoUrl: "https://www.google.com/s2/favicons?domain=mistral.ai&sz=32",
    keyPlaceholder: "...",
    models: [
      { value: "mistral-large-latest", label: "Mistral Large" },
      { value: "magistral-medium-latest", label: "Magistral Medium" },
      { value: "codestral-latest", label: "Codestral" },
      { value: "mistral-medium-latest", label: "Mistral Medium" },
      { value: "mistral-small-latest", label: "Mistral Small" },
    ],
  },
  {
    provider: "xai",
    label: "xAI",
    logoUrl: "https://www.google.com/s2/favicons?domain=x.ai&sz=32",
    keyPlaceholder: "xai-...",
    models: [
      { value: "grok-4-0709", label: "Grok 4" },
      { value: "grok-3", label: "Grok 3" },
      { value: "grok-3-mini", label: "Grok 3 mini" },
    ],
  },
];

export function providerForModel(model: string): AIProvider {
  if (model.startsWith("claude")) return "anthropic";
  if (model.startsWith("gemini")) return "google";
  if (model.startsWith("llama") || model.startsWith("meta-llama") || model.startsWith("qwen"))
    return "groq";
  if (model.startsWith("mistral") || model.startsWith("codestral") || model.startsWith("magistral"))
    return "mistral";
  if (model.startsWith("grok")) return "xai";
  return "openai";
}

export type ReasoningEffort = "none" | "minimal" | "low" | "medium" | "high";

export function getProviderOptions(
  provider: AIProvider,
  model: string,
  effort: ReasoningEffort,
): Record<string, unknown> {
  if (provider === "openai") {
    if (effort === "none") return {};
    const effortMap = { minimal: "low", low: "low", medium: "medium", high: "high" } as const;
    return { openai: { reasoningEffort: effortMap[effort] } };
  }
  if (provider === "anthropic") {
    if (effort === "none") return { anthropic: { thinking: { type: "disabled" } } };
    const budgetTokens = { minimal: 256, low: 1024, medium: 5000, high: 16000 }[effort];
    return { anthropic: { thinking: { type: "enabled", budgetTokens } } };
  }
  if (provider === "google") {
    if (effort === "none") return { google: { thinkingConfig: { thinkingBudget: 0 } } };
    const thinkingBudget = { minimal: 128, low: 512, medium: 4096, high: 16000 }[effort];
    return { google: { thinkingConfig: { thinkingBudget } } };
  }
  return {};
}

interface ModelPickerProps {
  model: string;
  setModel: (m: string) => void;
  provider: AIProvider;
  allProviderKeys: Record<Exclude<AIProvider, "tavily">, AIKeyState>;
}

export function ModelPicker({ model, setModel, provider, allProviderKeys }: ModelPickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(provider);

  const currentGroup = MODEL_GROUPS.find((g) => g.provider === provider);
  const currentModelLabel =
    MODEL_GROUPS.flatMap((g) => g.models).find((m) => m.value === model)?.label ?? model;
  const selectedGroup =
    MODEL_GROUPS.find((g) => g.provider === selectedProvider) ?? MODEL_GROUPS[0];
  const selectedProviderKeys = allProviderKeys[selectedProvider as Exclude<AIProvider, "tavily">];

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setSelectedProvider(provider);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-fit justify-between gap-2 px-2 text-xs"
        >
          <div className="flex items-center gap-1.5">
            {currentGroup && (
              <img
                src={currentGroup.logoUrl}
                alt={currentGroup.label}
                className="h-4 w-4 rounded"
              />
            )}
            {currentModelLabel}
          </div>
          <ChevronsUpDownIcon className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-2"
        align="start"
      >
        <div className="flex gap-2">
          <div className="flex w-12 flex-col gap-1 border-r border-border/50 pr-2">
            {MODEL_GROUPS.map((g) => {
              const isKeyConfigured =
                allProviderKeys[g.provider as Exclude<AIProvider, "tavily">]?.isSaved;
              return (
                <button
                  key={g.provider}
                  onClick={() => setSelectedProvider(g.provider)}
                  title={`${g.label}${!isKeyConfigured ? " (no API key)" : ""}`}
                  className={cn(
                    "flex h-9 w-10 items-center justify-center rounded border border-transparent transition-all",
                    selectedProvider === g.provider
                      ? "border-border bg-accent"
                      : "opacity-50 hover:bg-muted hover:opacity-80",
                  )}
                >
                  <img
                    src={g.logoUrl}
                    alt={g.label}
                    className="h-5 w-5 rounded"
                  />
                </button>
              );
            })}
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-1.5 px-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
              {selectedGroup.label}
            </p>
            {!selectedProviderKeys?.isSaved && (
              <p className="mb-1.5 px-1 text-[10px] text-amber-500">No API key configured</p>
            )}
            <div className="h-48 overflow-y-auto">
              {selectedGroup.models.map((m) => {
                const isKeyConfigured = selectedProviderKeys?.isSaved;
                return (
                  <button
                    key={m.value}
                    disabled={!isKeyConfigured}
                    onClick={() => {
                      setModel(m.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded px-2 py-2 text-xs transition-colors",
                      isKeyConfigured
                        ? "cursor-pointer hover:bg-accent hover:text-accent-foreground"
                        : "cursor-not-allowed opacity-40",
                      model === m.value && "bg-accent text-accent-foreground",
                    )}
                  >
                    {m.label}
                    {model === m.value && <CheckIcon className="h-3 w-3" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const EFFORT_OPTIONS: { value: ReasoningEffort; label: string }[] = [
  { value: "none", label: "Off" },
  { value: "minimal", label: "Min" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Med" },
  { value: "high", label: "High" },
];

interface ReasoningEffortPickerProps {
  model: string;
  effort: ReasoningEffort | null;
  onEffortChange: (e: ReasoningEffort | null) => void;
}

export function ReasoningEffortPicker({
  model,
  effort,
  onEffortChange,
}: ReasoningEffortPickerProps) {
  const [open, setOpen] = useState(false);

  const isReasoningModel =
    MODEL_GROUPS.flatMap((g) => g.models).find((m) => m.value === model)?.reasoning === true;
  if (!isReasoningModel) return null;

  const current = EFFORT_OPTIONS.find((o) => o.value === effort);

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-fit justify-between gap-2 px-2 text-xs"
        >
          <span className="text-muted-foreground">Think:</span>
          <span>{current?.label ?? "Off"}</span>
          <ChevronUpIcon className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-36 p-1"
        align="start"
      >
        {EFFORT_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => {
              onEffortChange(value);
              setOpen(false);
            }}
            className={cn(
              "flex w-full items-center justify-between rounded px-2 py-1.5 text-xs transition-colors hover:bg-accent hover:text-accent-foreground",
              effort === value && "bg-accent text-accent-foreground",
            )}
          >
            {label}
            {effort === value && <CheckIcon className="h-3 w-3" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
