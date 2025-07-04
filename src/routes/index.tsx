import { useTheme } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRightIcon,
  SparklesIcon,
  StarIcon,
  TerminalIcon
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: RouteComponent
});

function RouteComponent() {
  const { theme } = useTheme();

  return (
    <div className="flex flex-col w-full gap-0">
      <section className="w-full flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 dark:from-background dark:via-primary/10 dark:to-secondary/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <div className="absolute top-20 left-20 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-40 right-20 w-40 h-40 bg-secondary/30 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-accent/25 rounded-full blur-2xl animate-pulse delay-500" />

        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 30%, rgba(var(--primary),0.15) 0%, transparent 70%)"
          }}
        />

        <div className="flex flex-col items-center z-10 max-w-6xl mx-auto px-8">
          {/* Badge */}
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-8 backdrop-blur-sm">
            <SparklesIcon className="w-4 h-4 text-foreground dark:text-primary" />
            <span className="text-sm font-medium text-foreground dark:text-primary">
              Now with AI-powered parsing
            </span>
          </div>

          <h1 className="text-8xl md:text-9xl font-mono mb-6 drop-shadow-xl text-primary bg-clip-text flex items-center gap-4">
            <TerminalIcon size={80} className="text-primary" />
            Commandly
          </h1>

          <p className="text-2xl md:text-3xl text-foreground/80 max-w-4xl mb-12 text-center font-light leading-relaxed">
            Build, preview, and manage CLI commands visually—no syntax to
            memorize, no flags to forget.
            <span className="font-semibold text-primary shadow-md shadow-primary">
              {" "}
              Make the terminal accessible, powerful, and fun.
            </span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Button
              size="lg"
              className="text-xl px-12 py-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-2xl focus:outline-none focus:ring-4 focus:ring-primary/40 rounded-2xl transition-all hover:shadow-3xl hover:scale-105 group relative overflow-hidden"
              asChild
            >
              <Link to="/tools" className="flex items-center gap-3">
                <span className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                Get Started
                <ArrowRightIcon className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-8 mt-16 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent/50 rounded-full animate-pulse" />
              <span>100% Free & Open Source</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent/60 rounded-full animate-pulse" />
              <span>Minimal UI</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent/70 rounded-full animate-pulse" />
              <span>Tool Editor</span>
            </div>
          </div>
        </div>
      </section>

      {/* What is Commandly */}
      <section className="w-full flex flex-col items-center gap-8 px-8 min-h-screen justify-center p-20">
        <div className="text-center max-w-4xl">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-br from-primary to-primary/30 bg-clip-text text-transparent">
            What is Commandly?
          </h2>
        </div>
        <div className="flex flex-col md:flex-row gap-16 w-full items-center justify-center">
          <div className="flex-1 max-w-xl text-xl leading-relaxed md:max-w-md font-sans">
            Meet your personal command-line assistant. <b>Build</b> complex CLI
            commands visually, <b>preview</b> them instantly, and skip syntax
            errors for good. Whether you’re a developer, sysadmin, or automation
            fan, Commandly makes the terminal simple and enjoyable.
            <br />
            <br />
            <ul className="list-disc list-inside text-lg text-muted-foreground mt-4 gap-4 font-serif">
              <li>Beginner-friendly and powerful for pros</li>
              <li>Share, save, and organize commands</li>
              <li>Instant feedback and error checking</li>
              <li>Modern, intuitive UI for a classic tool</li>
            </ul>
          </div>
          <div className="flex-[2.5] flex flex-col gap-4 items-center min-w-[0]">
            <Tabs
              defaultValue="ui"
              className="w-full flex flex-col items-center"
            >
              <TabsContent value="tool-editor" className="w-full">
                <img
                  src={
                    theme === "dark"
                      ? "/images/tool-editor-dark.png"
                      : "/images/tool-editor.png"
                  }
                  alt="Commandly Tool Editor Screenshot"
                  loading="eager"
                  className="rounded-2xl border-2 border-muted w-full max-w-[1600px] min-h-[400px] min-w-[900px] object-contain bg-background p-4 shadow-primary shadow-2xl"
                />
              </TabsContent>
              <TabsContent value="ui" className="w-full">
                <img
                  src={
                    theme === "dark" ? "/images/ui-dark.png" : "/images/ui.png"
                  }
                  alt="Commandly UI Screenshot"
                  loading="eager"
                  className="rounded-2xl border-2 border-muted w-full max-w-[1600px] min-h-[400px] min-w-[900px] object-contain bg-background p-4 shadow-primary shadow-2xl"
                />
              </TabsContent>
              <TabsList className="grid w-fit grid-cols-2 mt-4 bg-muted/50 backdrop-blur-sm border border-muted rounded-full p-1 h-auto">
                <TabsTrigger
                  value="ui"
                  className="rounded-full px-4 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm hover:bg-muted-foreground/10 whitespace-nowrap h-auto cursor-pointer"
                >
                  UI
                </TabsTrigger>
                <TabsTrigger
                  value="tool-editor"
                  className="rounded-full px-4 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm hover:bg-muted-foreground/10 whitespace-nowrap h-auto cursor-pointer"
                >
                  Tool Editor
                </TabsTrigger>
              </TabsList>
            </Tabs>
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
        <div className="w-full flex flex-col lg:flex-row gap-8 mt-10 items-stretch justify-center">
          <div className="flex-1 min-h-[450px] h-full flex flex-col bg-gradient-to-br from-primary/15 via-primary/10 to-secondary/15 rounded-3xl p-8 shadow-2xl border border-primary/20 backdrop-blur-sm hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/8 to-secondary/8 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex items-center justify-center gap-3 mb-6 relative z-10">
              <div className="p-3 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                <StarIcon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Why use Commandly?
              </h3>
            </div>
            <ul className="list-none flex flex-col gap-4 w-full flex-1 relative z-10">
              <li className="flex items-start gap-4 p-4 rounded-xl bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 hover:bg-white/30 dark:hover:bg-white/15 transition-all duration-300 group/item">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                  <span className="text-primary-foreground text-sm font-bold">
                    ✓
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">
                    Reduce mistakes and speed up workflow
                  </span>
                  <span className="text-sm text-muted-foreground mt-1">
                    Build commands visually with instant validation
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-4 p-4 rounded-xl bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 hover:bg-white/30 dark:hover:bg-white/15 transition-all duration-300 group/item">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center shadow-lg">
                  <span className="text-secondary-foreground text-sm font-bold">
                    ✓
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">
                    Perfect for team onboarding
                  </span>
                  <span className="text-sm text-muted-foreground mt-1">
                    Visual learning for new team members
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-4 p-4 rounded-xl bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 hover:bg-white/30 dark:hover:bg-white/15 transition-all duration-300 group/item">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg">
                  <span className="text-accent-foreground text-sm font-bold">
                    ✓
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">
                    Document and share CLI knowledge
                  </span>
                  <span className="text-sm text-muted-foreground mt-1">
                    Build a library of reusable commands
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-4 p-4 rounded-xl bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 hover:bg-white/30 dark:hover:bg-white/15 transition-all duration-300 group/item">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-muted-foreground to-muted-foreground/80 flex items-center justify-center shadow-lg">
                  <span className="text-muted text-sm font-bold">✓</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">
                    Fun, interactive, and modern
                  </span>
                  <span className="text-sm text-muted-foreground mt-1">
                    Make terminal work enjoyable again
                  </span>
                </div>
              </li>
            </ul>
          </div>

          <div className="flex-1 min-h-[450px] h-full flex flex-col bg-gradient-to-br from-secondary/15 via-primary/10 to-accent/15 rounded-3xl p-8 shadow-2xl border border-secondary/20 backdrop-blur-sm hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/8 to-accent/8 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex items-center justify-center gap-3 mb-6 relative z-10">
              <div className="p-3 rounded-full bg-gradient-to-br from-secondary to-secondary/80 shadow-lg">
                <TerminalIcon className="w-6 h-6 text-secondary-foreground" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Integrations
              </h3>
            </div>
            <ul className="flex flex-col gap-4 w-full flex-1 relative z-10">
              <li className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-white/20 to-white/10 dark:from-white/15 dark:to-white/5 backdrop-blur-sm border border-white/30 hover:from-white/30 hover:to-white/20 dark:hover:from-white/20 dark:hover:to-white/10 transition-all duration-300 group/item">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg group-hover/item:scale-110 transition-transform duration-300">
                  <span className="text-primary-foreground font-mono text-lg font-bold">{`{}`}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-semibold text-foreground">
                    Export to JSON
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Nested or flat structure
                  </span>
                </div>
              </li>
              <li className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-white/20 to-white/10 dark:from-white/15 dark:to-white/5 backdrop-blur-sm border border-white/30 hover:from-white/30 hover:to-white/20 dark:hover:from-white/20 dark:hover:to-white/10 transition-all duration-300 group/item">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center shadow-lg group-hover/item:scale-110 transition-transform duration-300">
                  <span className="text-secondary-foreground text-xl">📋</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-semibold text-foreground">
                    Copy to clipboard
                  </span>
                  <span className="text-sm text-muted-foreground">
                    One-click command copying
                  </span>
                </div>
              </li>
              <li className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-white/20 to-white/10 dark:from-white/15 dark:to-white/5 backdrop-blur-sm border border-white/30 hover:from-white/30 hover:to-white/20 dark:hover:from-white/20 dark:hover:to-white/10 transition-all duration-300 group/item">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg group-hover/item:scale-110 transition-transform duration-300">
                  <span className="text-accent-foreground text-xl">💾</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-semibold text-foreground">
                    Save to local storage
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Persistent command library
                  </span>
                </div>
              </li>
              <li className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-white/20 to-white/10 dark:from-white/15 dark:to-white/5 backdrop-blur-sm border border-white/30 hover:from-white/30 hover:to-white/20 dark:hover:from-white/20 dark:hover:to-white/10 transition-all duration-300 group/item opacity-75">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-muted-foreground to-muted-foreground/80 flex items-center justify-center shadow-lg group-hover/item:scale-110 transition-transform duration-300">
                  <span className="text-muted text-xl">🔗</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-semibold text-foreground">
                    Share via link
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Team collaboration
                    </span>
                    <span className="px-2 py-1 text-xs bg-primary/10 text-foreground dark:bg-primary/30 dark:text-primary rounded-full font-medium border border-primary/30">
                      Coming Soon
                    </span>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="w-full flex flex-col items-center gap-12 px-8 min-h-screen justify-center py-20">
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
          <Link to="/tools" preload="render" viewTransition={false}>
            Get Started
          </Link>
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
    <div className="flex flex-col items-center gap-2 bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/15 dark:hover:bg-white/10">
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
    <div className="flex flex-col items-center gap-2 bg-muted/40 rounded-xl p-6 min-w-[200px] shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/15 dark:hover:bg-white/10">
      <span className="text-2xl font-bold text-primary">{number}</span>
      <span className="font-semibold text-lg">{title}</span>
      <span className="text-sm text-muted-foreground text-center">{desc}</span>
    </div>
  );
}
