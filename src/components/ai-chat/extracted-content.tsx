export interface ExtractResult {
  url: string;
  raw_content: string;
  hasMore?: boolean;
}

export function ExtractedContent({ results }: { results: ExtractResult[] }) {
  return (
    <div className="mt-2 space-y-2">
      {results.map((result) => {
        let hostname = result.url;

        try {
          hostname = new URL(result.url).hostname;
        } catch {
          // Ignore invalid URLs in partial tool output.
        }

        return (
          <div
            key={result.url}
            className="rounded border border-border/40 bg-muted/20"
          >
            <div className="flex items-center justify-between border-b border-border/30 px-3 py-1.5">
              <a
                href={result.url}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-muted-foreground hover:text-foreground hover:underline"
              >
                {hostname}
              </a>
              {result.hasMore && <span className="text-[10px] text-muted-foreground">partial</span>}
            </div>
            <pre className="max-h-40 overflow-y-auto px-3 py-2 font-mono text-[11px] wrap-break-word whitespace-pre-wrap text-muted-foreground">
              {result.raw_content}
            </pre>
          </div>
        );
      })}
    </div>
  );
}
