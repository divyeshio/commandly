import { Badge } from "@/components/ui/badge";
import { fetchRegistryList, type RegistryItem } from "@/lib/api/registry.api";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/docs/")({
  component: RouteComponent,
  loader: async () => {
    const items = await fetchRegistryList();
    return { items };
  },
});

function typeBadgeVariant(type: string): "default" | "secondary" | "outline" {
  if (type === "registry:block") return "default";
  if (type === "registry:component") return "secondary";
  return "outline";
}

function typeLabel(type: string): string {
  return type.replace("registry:", "");
}

function ItemCard({ item }: { item: RegistryItem }) {
  const installCmd = `npx shadcn@latest add https://commandly.divyeshio.in/r/${item.name}.json`;

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-5">
      <div className="flex items-center gap-2">
        <span className="text-base font-semibold">{item.title ?? item.name}</span>
        <Badge variant={typeBadgeVariant(item.type)}>{typeLabel(item.type)}</Badge>
      </div>
      {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
      <pre className="overflow-x-auto rounded bg-muted px-3 py-2 font-mono text-xs break-all whitespace-pre-wrap">
        {installCmd}
      </pre>
      <Link
        to="/docs/$componentName"
        params={{ componentName: item.name }}
        className="self-start text-sm text-primary hover:underline"
      >
        View details →
      </Link>
    </div>
  );
}

function RouteComponent() {
  const { items } = Route.useLoaderData();

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Components</h1>
        <p className="mt-2 text-muted-foreground">
          Install Commandly components into your project using the shadcn CLI.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <ItemCard
            key={item.name}
            item={item}
          />
        ))}
      </div>
    </div>
  );
}
