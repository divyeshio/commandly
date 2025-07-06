import { useTheme } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRightIcon, SparklesIcon, TerminalIcon } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  component: RouteComponent
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
  "ansible"
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
        createdAt: Date.now()
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
          .filter((tool) => tool.opacity > 0)
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
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {tools.map((tool) => (
        <div
          key={tool.id}
          className="absolute text-foreground/40 font-mono select-none"
          style={{
            left: `calc(50% + ${tool.x}px)`,
            top: `calc(10% + ${tool.y}px)`,
            transform: `scale(${tool.scale})`,
            opacity: tool.opacity,
            fontSize: "1rem",
            zIndex: 1
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
    <div className="flex flex-col w-full gap-0">
      <section className="w-full flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 dark:from-background dark:via-primary/10 dark:to-secondary/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <div className="absolute top-20 left-20 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-40 right-20 w-40 h-40 bg-primary/30 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-accent/25 rounded-full blur-2xl animate-pulse delay-500" />

        <FloatingToolNames />

        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 30%, rgba(var(--primary),0.15) 0%, transparent 70%)"
          }}
        />

        <div className="flex flex-col items-center z-10 max-w-6xl mx-auto px-8">
          {/* Badge */}
          <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-full px-4 py-2 mb-8 backdrop-blur-xs">
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
      <section className="w-full flex flex-col items-center gap-12 px-8 justify-center py-40">
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
    <div className="flex flex-col items-center gap-2 bg-card/10 dark:bg-card-foreground/5 backdrop-blur-md border border-card/20 dark:border-card/10 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/15 dark:hover:bg-white/10">
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
