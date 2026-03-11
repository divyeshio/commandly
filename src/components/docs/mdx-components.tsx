import { CodeBlockCommand } from "./code-block-command";
import { ComponentPreview } from "./component-preview";
import { demos } from "./demos";
import { Step, Steps } from "./steps";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckIcon, ClipboardIcon } from "lucide-react";
import type { MDXComponents } from "mdx/types";
import { useRef, useState } from "react";

function BoundComponentPreview(props: { name: string; description?: string }) {
  return (
    <ComponentPreview
      {...props}
      demos={demos}
    />
  );
}

function CopyableCodeBlock({ children, ...props }: React.ComponentProps<"pre">) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  function copy() {
    const text = preRef.current?.textContent;
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="relative mb-4 overflow-hidden rounded-lg border bg-transparent">
      <Button
        size="icon"
        variant="ghost"
        onClick={copy}
        className="absolute top-2 right-2 z-10 h-7 w-7"
      >
        {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <ClipboardIcon className="h-3.5 w-3.5" />}
      </Button>
      <pre
        ref={preRef}
        className="overflow-x-auto p-4 text-sm"
        {...props}
      >
        {children}
      </pre>
    </div>
  );
}

export const mdxComponents: MDXComponents = {
  ComponentPreview: BoundComponentPreview,
  CodeBlockCommand,
  Steps,
  Step,
  CodeTabs: Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  h1: ({ children }) => <h1 className="mb-2 text-3xl font-bold tracking-tight">{children}</h1>,
  h2: ({ children }) => (
    <h2 className="mt-10 mb-4 text-xl font-semibold tracking-tight">{children}</h2>
  ),
  h3: ({ children }) => <h3 className="mt-6 mb-3 text-base font-semibold">{children}</h3>,
  p: ({ children }) => <p className="mb-4 text-sm leading-7 text-muted-foreground">{children}</p>,
  ul: ({ children }) => (
    <ul className="mb-4 ml-4 list-disc space-y-1 text-sm text-muted-foreground">{children}</ul>
  ),
  li: ({ children }) => <li className="leading-7">{children}</li>,
  a: ({ children, href }) => (
    <a
      href={href}
      className="text-primary underline underline-offset-4 hover:no-underline"
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="mb-4 w-full overflow-x-auto">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="border-b">{children}</thead>,
  th: ({ children }) => (
    <th className="px-3 py-2 text-left font-semibold text-foreground">{children}</th>
  ),
  td: ({ children }) => <td className="px-3 py-2 text-muted-foreground">{children}</td>,
  tr: ({ children }) => <tr className="border-b last:border-0">{children}</tr>,
  code: ({ children, ...props }) => {
    if (typeof children === "string" && !props["data-language"]) {
      return (
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
          {children}
        </code>
      );
    }
    return <code {...props}>{children}</code>;
  },
  pre: CopyableCodeBlock,
};
