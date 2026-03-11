import { ComponentPreviewTabs } from "./component-preview-tabs";
import type { DemoEntry } from "./demos";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckIcon, ClipboardIcon } from "lucide-react";
import { use, Suspense, useState } from "react";

interface ComponentPreviewProps {
  name: string;
  description?: string;
  demos: Record<string, DemoEntry>;
}

const htmlCache = new Map<string, Promise<string>>();

function getHtmlPromise(code: string): Promise<string> {
  if (!htmlCache.has(code)) {
    htmlCache.set(
      code,
      import("shiki").then(({ codeToHtml }) =>
        codeToHtml(code, {
          lang: "tsx",
          themes: { light: "github-light", dark: "github-dark-dimmed" },
        }),
      ),
    );
  }
  return htmlCache.get(code)!;
}

function SyntaxHighlightedCodeInner({ code }: { code: string }) {
  const html = use(getHtmlPromise(code));
  return (
    <div
      className="text-sm [&_pre]:overflow-x-auto [&_pre]:p-4"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function SyntaxHighlightedCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative">
      <Button
        size="icon"
        variant="ghost"
        onClick={copy}
        className="absolute top-2 right-2 z-10 h-7 w-7"
      >
        {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <ClipboardIcon className="h-3.5 w-3.5" />}
      </Button>
      <Suspense
        fallback={
          <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        }
      >
        <SyntaxHighlightedCodeInner code={code} />
      </Suspense>
    </div>
  );
}

export function ComponentPreview({ name, demos }: ComponentPreviewProps) {
  const entry = demos[name];

  return (
    <ComponentPreviewTabs
      preview={<entry.component />}
      code={entry ? <SyntaxHighlightedCode code={entry.code} /> : null}
    />
  );
}
