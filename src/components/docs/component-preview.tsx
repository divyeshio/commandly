import { ComponentPreviewTabs } from "./component-preview-tabs";
import type { DemoEntry } from "@/docs/demos";

interface ComponentPreviewProps {
  name: string;
  description?: string;
  demos: Record<string, DemoEntry>;
}

export function ComponentPreview({ name, demos }: ComponentPreviewProps) {
  const entry = demos[name];

  const code = entry ? (
    <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed">
      <code>{entry.code}</code>
    </pre>
  ) : null;

  return (
    <ComponentPreviewTabs
      preview={<entry.component />}
      code={code}
    />
  );
}
