import { Button } from "@/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { TerminalIcon } from "lucide-react";

export const Route = createFileRoute("/")({
  component: RouteComponent
});

function RouteComponent() {
  return (
    <div className="flex flex-col w-full gap-10">
      <section className="w-full flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-primary/65 via-secondary dark:from-primary/30 dark:via-black/80 dark:to-secondary/90 shadow-2xl relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background:
              "radial-gradient(ellipse at 60% 40%, rgba(255,255,255,0.10) 0%, transparent 70%)"
          }}
        />
        <h1 className="text-7xl font-mono mb-6 z-10 drop-shadow-xl dark:text-primary dark:drop-shadow-lg flex items-center gap-2">
          <TerminalIcon size={60} />
          Commandly
        </h1>
        <p className="text-2xl text-foreground max-w-3xl mb-10 text-center z-10 drop-shadow-md font-mono">
          Build, preview, and manage CLI commands visually—no syntax to
          memorize, no flags to forget. Commandly makes the terminal accessible,
          powerful, and fun for everyone.
        </p>
        <Button
          size="lg"
          className="text-lg px-10 py-6 z-10 border-2 border-primary bg-primary text-primary-foreground shadow-xl focus:outline-none focus:ring-4 focus:ring-primary/40 rounded-xl transition-all hover:shadow-2xl relative group"
          asChild
        >
          <Link to="/tools" className="relative z-10">
            <span className="absolute inset-0 rounded-xl pointer-events-none z-0 animate-glow-border" />
            Get Started
          </Link>
        </Button>
      </section>

      {/* What is Commandly */}
      <section className="w-full flex flex-col items-center gap-8 px-8 min-h-screen justify-center">
        <h2 className="text-4xl font-bold mb-2">What is Commandly?</h2>
        <div className="flex flex-col md:flex-row gap-16 w-full items-center justify-center">
          <div className="flex-1 max-w-xl text-xl leading-relaxed md:max-w-md">
            Commandly is your personal command-line assistant.{" "}
            <b>Visually build</b> complex CLI commands, <b>preview</b> them
            instantly, and never worry about syntax errors again. Whether you’re
            a developer, sysadmin, or just love automating things, Commandly
            makes the terminal accessible and fun.
            <br />
            <br />
            <ul className="list-disc list-inside text-lg text-muted-foreground mt-4">
              <li>Perfect for beginners and power users alike</li>
              <li>Share, save, and organize your favorite commands</li>
              <li>Instant feedback and error checking</li>
              <li>Modern, beautiful UI for a classic tool</li>
            </ul>
          </div>
          <div className="flex-[2.5] flex flex-col gap-4 items-center min-w-[0]">
            <img
              src="/image.png"
              alt="Commandly UI Screenshot"
              className="rounded-2xl border-2 border-primary shadow-2xl w-full max-w-[1600px] min-h-[400px] min-w-[900px] object-contain bg-background"
            />
            <span className="text-base text-muted-foreground">UI Preview</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="w-full flex flex-col items-center gap-12 px-8 min-h-screen justify-center">
        <h2 className="text-4xl font-bold mb-2">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full">
          <Feature
            icon="🧩"
            title="Visual Command Builder"
            desc="Drag, drop, and configure commands and subcommands with ease. Organize your CLI logic visually and see the structure instantly."
          />
          <Feature
            icon="🪄"
            title="Parameter Wizard"
            desc="Add, edit, and validate parameters with a friendly UI. Supports types, defaults, and advanced validation."
          />
          <Feature
            icon="🔮"
            title="Runtime Preview"
            desc="See your command output update in real time as you build. No more guessing what your command will do."
          />
          <Feature
            icon="💾"
            title="Saved Commands"
            desc="Store your favorite commands in local storage for quick access. Organize by project or tag."
          />

          <Feature
            icon="🌙"
            title="Dark Mode"
            desc="For night owls and terminal hackers alike. Switch themes instantly."
          />
          <Feature
            icon="🤖"
            title="AI Parsing"
            desc="Parse entire tool using just the help text. Commandly can intelligently extract commands, parameters, and descriptions from your CLI tools."
          />
        </div>
        <div className="w-full flex flex-col md:flex-row gap-8 mt-10 items-center justify-center">
          <div className="flex-1 bg-muted/40 rounded-xl p-8 shadow-md text-lg">
            <b>Why use Commandly?</b>
            <br />
            <ul className="list-disc list-inside mt-2 text-muted-foreground">
              <li>Reduce mistakes and speed up your workflow</li>
              <li>Great for onboarding new team members</li>
              <li>Perfect for documenting and sharing CLI knowledge</li>
              <li>Fun, interactive, and always up to date</li>
            </ul>
          </div>
          <div className="flex-1 bg-muted/40 rounded-xl p-8 shadow-md text-lg">
            <b>Integrations</b>
            <br />
            <ul className="list-disc list-inside mt-2 text-muted-foreground">
              <li>Export to JSON (nested or flat)</li>
              <li>Copy to clipboard</li>
              <li>Save to local storage</li>
              <li>Share via link (coming soon!)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="w-full flex flex-col items-center gap-12 px-8 min-h-screen justify-center">
        <h2 className="text-4xl font-bold mb-2">How it Works</h2>
        <div className="flex flex-col md:flex-row gap-10 w-full items-center justify-center">
          <Step
            number={1}
            title="Add Command"
            desc="Start by adding your main command and any subcommands. Use the visual builder to structure your CLI logic."
          />
          <Step
            number={2}
            title="Customize"
            desc="Add parameters, set dependencies, and tweak validations. Preview everything as you go."
          />
          <Step
            number={3}
            title="Preview & Export"
            desc="See the command, help menu, and JSON output instantly. Save, copy, or share your work."
          />
        </div>
        <div className="w-full flex flex-col md:flex-row gap-8 mt-10 items-center justify-center">
          <div className="flex-1 bg-muted/40 rounded-xl p-8 shadow-md text-lg">
            <b>Tips for Power Users</b>
            <br />
            <ul className="list-disc list-inside mt-2 text-muted-foreground">
              <li>Use exclusion groups for advanced option logic</li>
              <li>Preview runtime output before running anything</li>
              <li>Save commands for later use</li>
              <li>Use the AI parser to extract commands and parameters!</li>
            </ul>
          </div>
          <div className="flex-1 bg-muted/40 rounded-xl p-8 shadow-md text-lg">
            <b>Coming Soon</b>
            <br />
            <ul className="list-disc list-inside mt-2 text-muted-foreground">
              <li>Team collaboration features</li>
              <li>Cloud sync</li>
              <li>More export formats</li>
              <li>More tools</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <footer className="w-full flex flex-col items-center gap-8 py-16 bg-gradient-to-t from-primary/20 to-background border-t border-muted mt-auto shadow-inner">
        <h2 className="text-3xl font-bold mb-2 dark:text-primary">
          Ready to build your next command?
        </h2>
        <Button
          size="lg"
          className="text-lg px-10 py-6 border-2 border-primary shadow-xl focus:outline-none focus:ring-4 focus:ring-primary/40 rounded-xl transition-all  hover:shadow-2xl"
          asChild
        >
          <Link to="/tools">Get Started</Link>
        </Button>
        <div className="flex gap-8 mt-8">
          <a
            href="https://github.com/divyeshio/commandly"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary text-muted-foreground transition-colors text-lg"
          >
            GitHub
          </a>
          <a
            href="https://twitter.com/divyeshio"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary text-muted-foreground transition-colors text-lg"
          >
            Twitter
          </a>
          <a
            href="https://linkedin.com/in/divyeshio"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary text-muted-foreground transition-colors text-lg"
          >
            LinkedIn
          </a>
        </div>
        <span className="text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} Commandly. All rights reserved.
        </span>
      </footer>
    </div>
  );
}

interface FeatureProps {
  icon: string;
  title: string;
  desc: string;
}
function Feature({ icon, title, desc }: FeatureProps) {
  return (
    <div className="flex flex-col items-center gap-2 bg-muted/40 rounded-xl p-6 shadow-sm">
      <span className="text-3xl">{icon}</span>
      <span className="font-semibold text-lg">{title}</span>
      <span className="text-sm text-muted-foreground text-center">{desc}</span>
    </div>
  );
}

interface StepProps {
  number: number;
  title: string;
  desc: string;
}
function Step({ number, title, desc }: StepProps) {
  return (
    <div className="flex flex-col items-center gap-2 bg-muted/40 rounded-xl p-6 shadow-sm min-w-[200px]">
      <span className="text-2xl font-bold text-primary">{number}</span>
      <span className="font-semibold text-lg">{title}</span>
      <span className="text-sm text-muted-foreground text-center">{desc}</span>
    </div>
  );
}
