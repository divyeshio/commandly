import { useTheme } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRightIcon, GitMergeIcon, SparklesIcon, TerminalIcon } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

interface FloatingTool {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  opacity: number;
  phase: "appearing" | "floating" | "disappearing";
  createdAt: number;
}

const TOOL_NAMES = [
  "asnmap",
  "cdncheck",
  "dnsx",
  "shuffledns",
  "subfinder",
  "yt-dlp",
  "git",
  "npm",
  "curl",
  "grep",
  "find",
  "docker",
  "bash",
  "zsh",
  "sh",
  "fish",
  "curl",
  "wget",
  "git",
  "grep",
  "sed",
  "awk",
  "find",
  "xargs",
  "ssh",
  "scp",
  "rsync",
  "tar",
  "zip",
  "unzip",
  "gzip",
  "bzip2",
  "lzma",
  "xz",
  "top",
  "htop",
  "ps",
  "ping",
  "traceroute",
  "netstat",
  "ss",
  "ip",
  "ifconfig",
  "dig",
  "nslookup",
  "whois",
  "nmap",
  "tcpdump",
  "tshark",
  "lsof",
  "strace",
  "ltrace",
  "journalctl",
  "dmesg",
  "systemctl",
  "service",
  "chmod",
  "chown",
  "ln",
  "cp",
  "mv",
  "rm",
  "mkdir",
  "rmdir",
  "touch",
  "stat",
  "df",
  "du",
  "ls",
  "tree",
  "echo",
  "printf",
  "tee",
  "less",
  "more",
  "cat",
  "head",
  "tail",
  "diff",
  "patch",
  "sort",
  "uniq",
  "tr",
  "cut",
  "split",
  "wc",
  "yes",
  "sleep",
  "time",
  "date",
  "cal",
  "env",
  "export",
  "alias",
  "unalias",
  "clear",
  "history",
  "man",
  "info",
  "which",
  "whereis",
  "type",
  "uname",
  "hostname",
  "su",
  "sudo",
  "docker",
  "kubectl",
  "terraform",
  "ansible",
];

function FloatingToolNames() {
  const [tools, setTools] = useState<FloatingTool[]>([]);

  useEffect(() => {
    const spawnTool = () => {
      const newTool: FloatingTool = {
        id: Math.random().toString(36).substr(2, 9),
        name: TOOL_NAMES[Math.floor(Math.random() * TOOL_NAMES.length)],
        x: 0, // Spread across wider area
        y: -50, // Start from top
        vx: (Math.random() - 0.5) * 2, // Random horizontal velocity
        vy: Math.random() * 3 + 1, // Downward velocity
        scale: 0,
        opacity: 0,
        phase: "appearing",
        createdAt: Date.now(),
      };

      setTools((prev) => [...prev, newTool]);
    };

    const animate = () => {
      setTools((prev) =>
        prev
          .map((tool) => {
            const age = Date.now() - tool.createdAt;
            const newTool = { ...tool };

            // Update position
            newTool.x += newTool.vx;
            newTool.y += newTool.vy;

            // Phase transitions and animations
            if (tool.phase === "appearing" && age < 1000) {
              newTool.scale = Math.min(1, age / 100);
              newTool.opacity = Math.min(0.7, age / 1000);
            } else if (tool.phase === "appearing" && age >= 1000) {
              newTool.phase = "floating";
              newTool.scale = 1;
              newTool.opacity = 0.7;
            } else if (tool.phase === "floating" && age < 8000) {
              // Floating behavior - gentle movement, keep scale and opacity stable
              newTool.vx += (Math.random() - 0.5) * 0.1;
              newTool.vy += (Math.random() - 0.5) * 0.1;

              // Limit velocity
              newTool.vx = Math.max(-2, Math.min(2, newTool.vx));
              newTool.vy = Math.max(-2, Math.min(2, newTool.vy));
            } else if (tool.phase === "floating" && age >= 9000) {
              newTool.phase = "disappearing";
            } else if (tool.phase === "disappearing") {
              const disappearTime = age - 9000;
              newTool.opacity = Math.max(0, 0.7 - disappearTime / 2000);
            }

            return newTool;
          })
          .filter((tool) => tool.opacity > 0),
      );
    };

    // Spawn tools periodically
    const spawnInterval = setInterval(spawnTool, 1000);

    // Animation loop
    const animationInterval = setInterval(animate, 35);

    return () => {
      clearInterval(spawnInterval);
      clearInterval(animationInterval);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {tools.map((tool) => (
        <div
          key={tool.id}
          className="absolute font-mono text-foreground/40 select-none"
          style={{
            left: `calc(50% + ${tool.x}px)`,
            top: `calc(10% + ${tool.y}px)`,
            transform: `scale(${tool.scale})`,
            opacity: tool.opacity,
            fontSize: "1rem",
            zIndex: 1,
          }}
        >
          {tool.name}
        </div>
      ))}
    </div>
  );
}

function RouteComponent() {
  const { theme } = useTheme();

  return (
    <div className="flex w-full flex-col gap-0">
      <section className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-linear-to-br from-background via-primary/5 to-secondary/10 dark:from-background dark:via-primary/10 dark:to-secondary/20">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />

        <div className="absolute top-20 left-20 h-32 w-32 animate-pulse rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-20 bottom-40 h-40 w-40 animate-pulse rounded-full bg-primary/30 blur-3xl delay-1000" />
        <div className="absolute top-1/2 left-1/4 h-20 w-20 animate-pulse rounded-full bg-accent/25 blur-2xl delay-500" />

        <FloatingToolNames />

        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 30%, rgba(var(--primary),0.15) 0%, transparent 70%)",
          }}
        />

        <div className="z-10 mx-auto flex max-w-6xl flex-col items-center px-8">
          {/* Badge */}
          <div className="mb-8 flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 backdrop-blur-xs">
            <SparklesIcon className="h-4 w-4 text-foreground dark:text-primary" />
            <span className="text-sm font-medium text-foreground dark:text-primary">
              Now with AI-powered parsing
            </span>
          </div>

          <h1 className="mb-6 flex items-center gap-4 bg-clip-text font-mono text-8xl text-primary drop-shadow-xl md:text-9xl">
            <TerminalIcon
              size={80}
              className="text-primary"
            />
            Commandly
          </h1>

          <p className="mb-12 max-w-4xl text-center text-2xl leading-relaxed font-light text-foreground/80 md:text-3xl">
            Build, preview, and manage CLI commands visually—no syntax to memorize, no flags to
            forget.
            <span className="font-semibold text-primary shadow-md shadow-primary">
              {" "}
              Make the terminal accessible, powerful, and fun.
            </span>
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="hover:shadow-3xl group relative overflow-hidden rounded-2xl bg-linear-to-r from-primary to-primary/80 px-12 py-8 text-xl text-primary-foreground shadow-2xl transition-all hover:scale-105 hover:from-primary/90 hover:to-primary focus:ring-4 focus:ring-primary/40 focus:outline-none"
              asChild
            >
              <Link
                to="/tools"
                className="flex items-center gap-3"
              >
                <span className="absolute inset-0 bg-linear-to-r from-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                Get Started
                <ArrowRightIcon className="h-6 w-6 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          <div className="mt-16 flex items-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-accent/50" />
              <span>100% Free & Open Source</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-accent/60" />
              <span>Minimal UI</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-accent/70" />
              <span>Tool Editor</span>
            </div>
          </div>
        </div>
      </section>

      {/* What is Commandly */}
      <section className="flex min-h-screen w-full flex-col items-center justify-center gap-8 p-20 px-8">
        <div className="max-w-4xl text-center">
          <h2 className="mb-6 bg-linear-to-br from-primary to-primary/30 bg-clip-text text-5xl font-bold text-transparent">
            What is Commandly?
          </h2>
        </div>
        <div className="flex w-full flex-col items-center justify-center gap-16 md:flex-row">
          <div className="max-w-xl flex-1 font-sans text-xl leading-relaxed md:max-w-md">
            Meet your personal command-line assistant. <b>Build</b> complex CLI commands visually,{" "}
            <b>preview</b> them instantly, and skip syntax errors for good. Whether you're a
            developer, sysadmin, or automation fan, Commandly makes the terminal simple and
            enjoyable.
            <br />
            <br />
            <ul className="mt-4 list-inside list-disc gap-4 font-serif text-lg text-muted-foreground">
              <li>Beginner-friendly and powerful for pros</li>
              <li>Share, save, and organize commands</li>
              <li>Instant feedback and error checking</li>
              <li>Modern, intuitive UI for a classic tool</li>
            </ul>
          </div>
          <div className="flex min-w-0 flex-[2.5] flex-col items-center gap-4">
            <Tabs
              defaultValue="ui"
              className="flex w-full flex-col items-center"
            >
              <div className="grid w-full">
                <TabsContent
                  forceMount
                  value="tool-editor"
                  className="w-full transition-opacity duration-200 [grid-area:1/1] data-[state=inactive]:pointer-events-none data-[state=inactive]:opacity-0"
                >
                  <img
                    src={
                      theme === "dark" ? "/images/tool-editor-dark.png" : "/images/tool-editor.png"
                    }
                    alt="Commandly Tool Editor Screenshot"
                    loading="eager"
                    className="min-h-100 w-full max-w-400 min-w-225 rounded-2xl border-2 border-muted bg-background object-contain p-4 shadow-2xl shadow-primary"
                  />
                </TabsContent>
                <TabsContent
                  forceMount
                  value="ui"
                  className="w-full transition-opacity duration-200 [grid-area:1/1] data-[state=inactive]:pointer-events-none data-[state=inactive]:opacity-0"
                >
                  <img
                    src={theme === "dark" ? "/images/ui-dark.png" : "/images/ui.png"}
                    alt="Commandly UI Screenshot"
                    loading="eager"
                    className="min-h-100 w-full max-w-400 min-w-225 rounded-2xl border-2 border-muted bg-background object-contain p-4 shadow-2xl shadow-primary"
                  />
                </TabsContent>
              </div>
              <TabsList className="mt-4 grid h-auto w-fit grid-cols-2 rounded-full border border-muted bg-muted/50 p-1 backdrop-blur-sm">
                <TabsTrigger
                  value="ui"
                  className="h-auto cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-all hover:bg-muted-foreground/10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                >
                  UI
                </TabsTrigger>
                <TabsTrigger
                  value="tool-editor"
                  className="h-auto cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-all hover:bg-muted-foreground/10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                >
                  Tool Editor
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="flex min-h-screen w-full flex-col items-center justify-center gap-12 px-8">
        <h2 className="mb-2 text-4xl font-bold">Features</h2>
        <div className="grid w-full grid-cols-1 gap-10 md:grid-cols-3">
          <Feature
            icon="🌳"
            title="Visual Command Tree"
            desc="Build hierarchical command structures with nested subcommands. Add, edit, delete, and reorganize commands through an intuitive tree interface."
          />
          <Feature
            icon="⚙️"
            title="Advanced Parameter Editor"
            desc="Configure parameters with types, flags, default values, enums, dependencies, and validations. Supports global and per-command parameters."
          />
          <Feature
            icon="👀"
            title="Live Runtime Preview"
            desc="Interactive preview with real parameter values and live validation. See exactly what your command will look like before running it."
          />
          <Feature
            icon="💾"
            title="Command Library"
            desc="Save, organize, and manage your favorite commands in local storage. Copy, delete, and reuse commands across sessions."
          />
          <Feature
            icon="📤"
            title="JSON Export"
            desc="Export tool definitions as structured JSON (flat or nested format) for sharing, backup, or integration with other tools."
          />
          <Feature
            icon="🤖"
            title="AI-Powered Parsing"
            desc="Parse CLI help text using OpenAI to automatically extract commands, parameters, and descriptions. Turn any tool's help into a structured definition."
          />
        </div>
      </section>

      {/* How it Works */}
      <section className="flex w-full flex-col items-center justify-center gap-12 px-8 py-40">
        <h2 className="mb-2 text-4xl font-bold">How it Works</h2>
        <div className="flex w-full flex-col items-center justify-center gap-10 md:flex-row">
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
      </section>

      {/* Final Call to Action */}
      <footer className="mt-auto flex w-full flex-col items-center gap-8 border-t border-muted bg-linear-to-t from-primary/20 to-background py-16 shadow-inner">
        <h2 className="mb-2 text-3xl font-bold dark:text-primary">
          Ready to build your next command?
        </h2>
        <Button
          size="lg"
          className="rounded-xl border-2 border-primary px-10 py-6 text-lg shadow-xl transition-all hover:shadow-2xl focus:ring-4 focus:ring-primary/40 focus:outline-none"
          asChild
        >
          <Link to="/tools">Get Started</Link>
        </Button>
        <div className="mt-8 flex gap-8">
          <a
            href="https://github.com/divyeshio/commandly"
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg text-muted-foreground transition-colors hover:text-primary"
          >
            GitHub
          </a>
          <a
            href="https://twitter.com/divyeshio"
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg text-muted-foreground transition-colors hover:text-primary"
          >
            Twitter
          </a>
          <a
            href="https://linkedin.com/in/divyeshio"
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg text-muted-foreground transition-colors hover:text-primary"
          >
            LinkedIn
          </a>
        </div>
        <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Commandly. All rights reserved.</span>
          {COMMIT_SHA && (
            <>
              <a
                href={`https://github.com/divyeshio/commandly/commit/${COMMIT_SHA}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-1 font-mono transition-colors hover:text-primary"
              >
                <GitMergeIcon
                  size={12}
                  className="text-muted-foreground"
                />
                {COMMIT_SHA.slice(0, 7)}
              </a>
            </>
          )}
        </div>
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
    <div className="flex flex-col items-center gap-2 rounded-xl border border-card/20 bg-card/10 p-6 shadow-lg backdrop-blur-md transition-all duration-300 hover:bg-white/15 hover:shadow-xl dark:border-card/10 dark:bg-card-foreground/5 dark:hover:bg-white/10">
      <span className="text-3xl">{icon}</span>
      <span className="text-lg font-semibold">{title}</span>
      <span className="text-center text-sm text-muted-foreground">{desc}</span>
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
    <div className="flex min-w-50 flex-col items-center gap-2 rounded-xl bg-muted/40 p-6 shadow-lg transition-all duration-300 hover:bg-white/15 hover:shadow-xl dark:hover:bg-white/10">
      <span className="text-2xl font-bold text-primary">{number}</span>
      <span className="text-lg font-semibold">{title}</span>
      <span className="text-center text-sm text-muted-foreground">{desc}</span>
    </div>
  );
}
