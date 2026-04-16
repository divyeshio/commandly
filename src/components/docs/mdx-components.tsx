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
    <div className="relative mb-5 w-full max-w-full overflow-hidden rounded-xl border bg-transparent">
      <Button
        size="icon"
        variant="ghost"
        onClick={copy}
        className="absolute top-2 right-2 z-10 h-8 w-8 bg-background/80 backdrop-blur-sm"
      >
        {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <ClipboardIcon className="h-3.5 w-3.5" />}
      </Button>
      <pre
        ref={preRef}
        className="max-w-full overflow-x-auto px-4 py-4 pr-14 text-xs sm:text-sm"
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
  h1: ({ children }) => (
    <h1 className="mb-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-10 mb-4 text-xl font-semibold tracking-tight text-balance sm:text-2xl">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-6 mb-3 text-base font-semibold sm:text-lg">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="mb-4 text-sm leading-7 [overflow-wrap:anywhere] text-muted-foreground">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="mb-4 ml-5 list-disc space-y-1 text-sm text-muted-foreground">{children}</ul>
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
    <div className="mb-4 w-full max-w-full overflow-x-auto">
      <table className="w-full min-w-[36rem] text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="border-b">{children}</thead>,
  th: ({ children }) => (
    <th className="px-3 py-2 text-left align-top font-semibold text-foreground">{children}</th>
  ),
  td: ({ children }) => <td className="px-3 py-2 align-top text-muted-foreground">{children}</td>,
  tr: ({ children }) => <tr className="border-b last:border-0">{children}</tr>,
  code: ({ children, ...props }) => {
    if (typeof children === "string" && !props["data-language"]) {
      return (
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs [overflow-wrap:anywhere] text-foreground">
          {children}
        </code>
      );
    }
    return <code {...props}>{children}</code>;
  },
  pre: CopyableCodeBlock,
};
