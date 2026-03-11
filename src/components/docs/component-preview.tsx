import { ComponentPreviewTabs } from "./component-preview-tabs";
import type { DemoEntry } from "./demos";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";

interface ComponentPreviewProps {
  name: string;
  description?: string;
  demos: Record<string, DemoEntry>;
}

function SyntaxHighlightedCode({ code }: { code: string }) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    import("shiki")
      .then(({ codeToHtml }) =>
        codeToHtml(code, {
          lang: "tsx",
          themes: { light: "github-light", dark: "github-dark" },
        }),
      )
      .then(setHtml);
  }, [code]);

  if (!html) {
    return (
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    );
  }

  return (
    <div
      className="text-xs [&_pre]:overflow-x-auto [&_pre]:p-4"
      dangerouslySetInnerHTML={{ __html: html }}
    />
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
