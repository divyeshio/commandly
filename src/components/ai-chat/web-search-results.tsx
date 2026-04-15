export interface WebSearchResult {
  title: string;
  url: string;
  content: string;
}

export function WebSearchResults({ results }: { results: WebSearchResult[] }) {
  return (
    <div className="mt-2 space-y-2">
      {results.slice(0, 3).map((result) => {
        let hostname = result.url;

        try {
          hostname = new URL(result.url).hostname;
        } catch {
          // Ignore invalid URLs in partial tool output.
        }

        return (
          <a
            key={result.url}
            href={result.url}
            target="_blank"
            rel="noreferrer"
            className="block rounded-lg border border-border/40 bg-muted/30 px-4 py-3 transition-colors hover:border-border/60"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-medium leading-tight text-foreground hover:underline">
                {result.title}
              </span>
              <span className="shrink-0 rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                {hostname}
              </span>
            </div>
            {result.content && (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{result.content}</p>
            )}
            <p className="mt-2 text-[10px] uppercase tracking-wide text-muted-foreground">{hostname}</p>
          </a>
        );
      })}
    </div>
  );
}
