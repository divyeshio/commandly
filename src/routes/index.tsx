import { Button } from "@/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: RouteComponent
});

function RouteComponent() {
  return (
    <main className="space-y-24">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
        <h1 className="text-6xl font-extrabold mb-4">Commandly</h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
          A user-friendly way to generate CLI commands using an intuitive
          graphical interface.
        </p>
        <Button size="lg">
          <Link to="/tools">Get Started</Link>
        </Button>
      </section>

      {/* Features Section */}
      <section className="px-6 md:px-24">
        <h2 className="text-4xl font-bold text-center mb-12">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold">Commands & Subcommands</h3>
            <p>
              Organize complex CLI tools with nested commands and intuitive
              hierarchies.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold">Parameters & Validations</h3>
            <p>
              Define parameters with custom validation and default values
              without writing code.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold">Runtime Preview</h3>
            <p>Instantly preview your command execution output in real-time.</p>
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold">JSON Output</h3>
            <p>
              Export your command specification as nested or flat JSON for
              integrations.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-6 md:px-24 bg-gray-50 py-16">
        <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
        <ol className="list-decimal list-inside space-y-8 max-w-3xl mx-auto text-lg">
          <li>
            <strong>Select a Tool:</strong> Choose or import an existing CLI
            from our tool library.
          </li>
          <li>
            <strong>Customize Options:</strong> Add commands, parameters, and
            validation rules via UI.
          </li>
          <li>
            <strong>Preview Execution:</strong> Run a live preview of your
            command to verify behavior.
          </li>
          <li>
            <strong>Export & Integrate:</strong> Download the JSON spec or copy
            the command for your workflows.
          </li>
        </ol>
      </section>

      {/* Screenshots Section */}
      <section className="px-6 md:px-24">
        <h2 className="text-4xl font-bold text-center mb-12">Screenshots</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="shadow-lg overflow-hidden rounded-lg">
            <img
              src="/docs/image.png"
              alt="Main UI Screenshot"
              className="w-full"
            />
          </div>
          <div className="shadow-lg overflow-hidden rounded-lg">
            <img
              src="/image.png"
              alt="Generated JSON Output"
              className="w-full"
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="flex flex-col items-center justify-center py-16">
        <h2 className="text-3xl font-semibold mb-4">
          Ready to streamline your CLI workflows?
        </h2>
        <Button size="lg">
          <Link to="/tools">Get Started</Link>
        </Button>
      </section>
    </main>
  );
}
