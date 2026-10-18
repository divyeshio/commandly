import {
  Installation,
  INSTALLATION_METHODS,
  InstallationMethodOption,
  InstallationSource,
} from "@/components/commandly/types/tool";
import { writeClipboard } from "@/components/commandly/utils/clipboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { CheckIcon, CopyIcon, ExternalLinkIcon } from "lucide-react";
import { useState } from "react";

/** The methods the tool documents, in presentation order. */
const usedMethods = (sources: InstallationSource[]): InstallationMethodOption[] =>
  INSTALLATION_METHODS.filter(({ method }) => sources.some((source) => source.method === method));

/**
 * A source's tab label. The package manager is the distinguishing name where there is one;
 * otherwise the key reads as a title, since a release binary or a container has no manager.
 */
const sourceLabel = (source: InstallationSource): string => {
  if (source.manager) return source.manager;
  const words = source.key.replace(/[-_]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

interface InstallationSourceCardProps {
  source: InstallationSource;
  /**
   * The name shown for this source directly above the card, when a tab selects it. The manager
   * badge is skipped when it would only repeat that name.
   */
  label?: string;
  copied: boolean;
  onCopy: () => void;
}

function InstallationSourceCard({ source, label, copied, onCopy }: InstallationSourceCardProps) {
  const showManager = !!source.manager && source.manager !== label;

  return (
    <div className="space-y-2 rounded-lg border p-3">
      {showManager && (
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className="font-mono text-xs"
          >
            {source.manager}
          </Badge>
        </div>
      )}

      <div className="flex items-start gap-2">
        <code className="min-w-0 flex-1 overflow-x-auto rounded bg-muted p-3 font-mono text-xs whitespace-pre-wrap">
          {source.command}
        </code>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          aria-label={`Copy ${source.key} command`}
          onClick={onCopy}
        >
          {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
        </Button>
      </div>

      {source.note && <p className="text-xs text-muted-foreground">{source.note}</p>}

      {source.url && (
        <a
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          Installation docs
          <ExternalLinkIcon className="size-3" />
        </a>
      )}
    </div>
  );
}

interface InstallationSectionProps {
  installation?: Installation;
  className?: string;
}

export function InstallationSection({ installation, className }: InstallationSectionProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const sources = installation?.sources ?? [];
  if (sources.length === 0) return null;

  const copy = async (key: string, command: string) => {
    try {
      await writeClipboard(command);
    } catch {
      return;
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1500);
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div>
        <h2 className="text-lg font-semibold">Installation</h2>
        <p className="text-sm text-muted-foreground">Ways to install this tool.</p>
      </div>

      {usedMethods(sources).map(({ method, label }) => {
        const group = sources.filter((source) => source.method === method);
        const tabbed = group.length > 1;
        const card = (source: InstallationSource) => (
          <InstallationSourceCard
            source={source}
            label={tabbed ? sourceLabel(source) : undefined}
            copied={copiedKey === source.key}
            onCopy={() => copy(source.key, source.command)}
          />
        );

        return (
          <section
            key={method}
            className="space-y-3"
          >
            <h3 className="font-mono text-xs tracking-[0.12em] text-muted-foreground uppercase">
              {label}
            </h3>

            {tabbed ? (
              <Tabs defaultValue={group[0].key}>
                <TabsList className="h-auto max-w-full flex-wrap justify-start">
                  {group.map((source) => (
                    <TabsTrigger
                      key={source.key}
                      value={source.key}
                      className="px-2.5 font-mono text-xs"
                    >
                      {sourceLabel(source)}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {group.map((source) => (
                  <TabsContent
                    key={source.key}
                    value={source.key}
                  >
                    {card(source)}
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              card(group[0])
            )}
          </section>
        );
      })}
    </div>
  );
}
