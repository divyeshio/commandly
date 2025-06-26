import { Button } from "@/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: RouteComponent
});

function RouteComponent() {
  return (
    <div>
      <Button size="lg">
        <Link to="/tools">Go to Tools</Link>
      </Button>
    </div>
  );
}
