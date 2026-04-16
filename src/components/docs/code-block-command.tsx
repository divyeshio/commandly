import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckIcon, ClipboardIcon, TerminalIcon } from "lucide-react";
import { useState } from "react";

type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

interface CodeBlockCommandProps {
  __pnpm__?: string;
  __npm__?: string;
  __yarn__?: string;
  __bun__?: string;
}

export function CodeBlockCommand({ __pnpm__, __npm__, __yarn__, __bun__ }: CodeBlockCommandProps) {
  const [pm, setPm] = useState<PackageManager>("pnpm");
  const [copied, setCopied] = useState(false);

  const commands: Record<PackageManager, string | undefined> = {
    pnpm: __pnpm__,
    npm: __npm__,
    yarn: __yarn__,
    bun: __bun__,
  };

  function copy() {
    const cmd = commands[pm];
    if (!cmd) return;
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="w-full max-w-full overflow-hidden rounded-lg border bg-transparent">
      <Tabs
        value={pm}
        onValueChange={(v) => setPm(v as PackageManager)}
      >
        <div className="flex items-center gap-2 border-b px-3 py-1.5">
          <TerminalIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1 overflow-x-auto">
            <TabsList className="min-w-max">
              {(Object.keys(commands) as PackageManager[]).map((key) => (
                <TabsTrigger
                  key={key}
                  value={key}
                >
                  {key}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={copy}
            className="h-7 w-7 shrink-0"
          >
            {copied ? (
              <CheckIcon className="h-3.5 w-3.5" />
            ) : (
              <ClipboardIcon className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
        {(Object.entries(commands) as [PackageManager, string | undefined][]).map(([key, cmd]) => (
          <TabsContent
            key={key}
            value={key}
            className="mt-0 px-4 py-3"
          >
            <div className="overflow-x-auto">
              <pre className="inline-block min-w-full bg-transparent">
                <code className="font-mono text-xs whitespace-nowrap sm:text-sm">{cmd}</code>
              </pre>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
