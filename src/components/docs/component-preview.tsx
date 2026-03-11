import { ComponentPreviewTabs } from "./component-preview-tabs";
import type { DemoEntry } from "./demos";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import githubdark from "@shikijs/themes/github-dark";
import githublight from "@shikijs/themes/github-light";
import { CheckIcon, ClipboardIcon } from "lucide-react";
import { Suspense, useState } from "react";
import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

const jsEngine = createJavaScriptRegexEngine();

interface ComponentPreviewProps {
  name: string;
  description?: string;
  demos: Record<string, DemoEntry>;
}

const highlighter = await createHighlighterCore({
  themes: [githubdark, githublight],
  langs: [import("@shikijs/langs/tsx")],
  engine: jsEngine,
});

function SyntaxHighlightedCodeInner({ code }: { code: string }) {
  const html = highlighter.codeToHtml(code, {
    lang: "tsx",
    themes: {
      light: "github-light",
      dark: "github-dark",
    },
  });
  return (
    <div
      className="text-sm [&_pre]:overflow-x-auto [&_pre]:p-4"
      dangerouslySetInnerHTML={{ __html: html }}
    ></div>
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
