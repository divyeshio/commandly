import { ToolRenderer } from "@/components/commandly/tool-renderer";
import type { Tool, ParameterType } from "@/components/commandly/types/flat";
import { generateCommand } from "@/components/commandly/utils/flat";
import { TextMarquee } from "@/components/text-marquee";
import { ToolBuilderProvider, useToolBuilder } from "@/components/tool-editor/tool-editor.context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tree, Folder, File } from "@/components/ui/file-tree";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRightIcon,
  BracesIcon,
  ChevronRightIcon,
  CodeIcon,
  FileTextIcon,
  FlagIcon,
  GitMergeIcon,
  GlobeIcon,
  HashIcon,
  MonitorIcon,
  SparklesIcon,
  TerminalIcon,
  WrenchIcon,
} from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import type { MouseEvent, ReactNode } from "react";
import { useCallback, useMemo, useRef } from "react";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function IsometricCard({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 200, damping: 20 });
  const springY = useSpring(y, { stiffness: 200, damping: 20 });
  const rotateX = useTransform(springY, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-8, 8]);

  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      x.set((e.clientX - rect.left) / rect.width - 0.5);
      y.set((e.clientY - rect.top) / rect.height - 0.5);
    },
    [x, y],
  );

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay }}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-lg transition-shadow duration-300 hover:shadow-2xl ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(600px circle at var(--mouse-x,50%) var(--mouse-y,50%), oklch(0.5 0 0 / 6%), transparent 60%)",
        }}
      />
      {children}
    </motion.div>
  );
}

const DEMO_TOOL: Tool = {
  binaryName: "curl",
  displayName: "cURL",
  info: { description: "Transfer data from or to a server using URLs." },
  commands: [],
  parameters: [
    {
      key: "url",
      name: "URL",
      description: "URL to fetch",
      parameterType: "Argument",
      dataType: "String",
      isRequired: true,
      position: 0,
      sortOrder: 0,
    },
    {
      key: "request",
      name: "Request Method",
      description: "HTTP method to use",
      parameterType: "Option",
      dataType: "String",
      shortFlag: "-X",
      longFlag: "--request",
      keyValueSeparator: " ",
      sortOrder: 1,
    },
    {
      key: "header",
      name: "Header",
      description: "Pass custom header(s) to the server",
      parameterType: "Option",
      dataType: "String",
      shortFlag: "-H",
      longFlag: "--header",
      keyValueSeparator: " ",
      sortOrder: 2,
    },
    {
      key: "data",
      name: "Data",
      description: "Send data in a POST request",
      parameterType: "Option",
      dataType: "String",
      shortFlag: "-d",
      longFlag: "--data",
      keyValueSeparator: " ",
      sortOrder: 3,
    },
    {
      key: "output",
      name: "Output",
      description: "Write output to file instead of stdout",
      parameterType: "Option",
      dataType: "String",
      shortFlag: "-o",
      longFlag: "--output",
      keyValueSeparator: " ",
      sortOrder: 4,
    },
    {
      key: "follow-redirects",
      name: "Follow Redirects",
      description: "Follow redirects",
      parameterType: "Flag",
      dataType: "Boolean",
      shortFlag: "-L",
      longFlag: "--location",
      sortOrder: 5,
    },
    {
      key: "verbose",
      name: "Verbose",
      description: "Make the operation more talkative",
      parameterType: "Flag",
      dataType: "Boolean",
      shortFlag: "-v",
      longFlag: "--verbose",
      sortOrder: 6,
    },
    {
      key: "silent",
      name: "Silent",
      description: "Silent mode, don't show progress or errors",
      parameterType: "Flag",
      dataType: "Boolean",
      shortFlag: "-s",
      longFlag: "--silent",
      sortOrder: 7,
    },
  ],
};

function ParameterIcon({ type }: { type: ParameterType }) {
  switch (type) {
    case "Flag":
      return <FlagIcon className="h-4 w-4" />;
    case "Option":
      return <HashIcon className="h-4 w-4" />;
    case "Argument":
      return <FileTextIcon className="h-4 w-4" />;
    default:
      return <HashIcon className="h-4 w-4" />;
  }
}

function ReadOnlyCommandTree() {
  const { tool, selectedCommand, setSelectedCommand, setContextSelection } = useToolBuilder();
  const rootCommands = tool.commands.filter((cmd) => !cmd.parentCommandKey);
  const isRootSelected = selectedCommand === null;
  const rootParamCount = tool.parameters.filter((p) => !p.commandKey && !p.isGlobal).length;
  const globalParamCount = tool.parameters.filter((p) => p.isGlobal).length;

  const handleRootClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCommand(null);
    setContextSelection({ commandKeys: [], parameterKeys: [] });
  };

  const handleCommandClick = (command: (typeof tool.commands)[0], e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCommand(command);
    setContextSelection({ commandKeys: [command.key], parameterKeys: [] });
  };

  const rootElement = (
    <span className="flex items-center gap-1.5">
      {tool.binaryName}
      {rootParamCount > 0 && (
        <Badge
          variant="secondary"
          className="h-4 min-w-4 px-1 text-[10px] leading-none"
        >
          {rootParamCount}
        </Badge>
      )}
      {globalParamCount > 0 && (
        <Badge
          variant="outline"
          className="h-4 min-w-4 px-1 text-[10px] leading-none"
        >
          {globalParamCount}
        </Badge>
      )}
    </span>
  );

  const renderCommand = (command: (typeof tool.commands)[0]) => {
    const subcommands = tool.commands.filter((c) => c.parentCommandKey === command.key);
    const isSelected = selectedCommand?.key === command.key;
    const paramCount = tool.parameters.filter((p) => p.commandKey === command.key).length;

    const nameElement = (
      <span className="flex items-center gap-1.5">
        {command.name}
        {paramCount > 0 && (
          <Badge
            variant="secondary"
            className="h-4 min-w-4 px-1 text-[10px] leading-none"
          >
            {paramCount}
          </Badge>
        )}
      </span>
    );

    if (subcommands.length > 0) {
      return (
        <Folder
          key={command.key}
          value={command.key}
          element={nameElement}
          isSelect={isSelected}
          className="px-2 py-1.5"
          onClick={(e: React.MouseEvent) => handleCommandClick(command, e)}
        >
          {subcommands.map((subcmd) => renderCommand(subcmd))}
        </Folder>
      );
    }

    return (
      <File
        key={command.key}
        value={command.key}
        isSelect={isSelected}
        className="w-full px-2 py-1.5"
        fileIcon={<ChevronRightIcon className="invisible size-4" />}
        onClick={(e: React.MouseEvent) => handleCommandClick(command, e)}
      >
        {nameElement}
      </File>
    );
  };

  return (
    <Tree
      className="flex-1 border-r border-muted"
      initialExpandedItems={["__root__", ...rootCommands.map((c) => c.key)]}
      indicator
      sort="none"
      openIcon={<TerminalIcon className="size-4" />}
      closeIcon={<TerminalIcon className="size-4" />}
    >
      <Folder
        value="__root__"
        element={rootElement}
        isSelect={isRootSelected}
        className="px-2 py-1.5 font-medium"
        onClick={handleRootClick}
      >
        {rootCommands.map((cmd) => renderCommand(cmd))}
      </Folder>
    </Tree>
  );
}

function ReadOnlyParameterList({ title, isGlobal = false }: { title: string; isGlobal?: boolean }) {
  const { selectedCommand, getGlobalParameters, getRootParameters, getParametersForCommand } =
    useToolBuilder();
  const globalParameters = getGlobalParameters();
  const rootParameters = getRootParameters();
  const commandParameters = selectedCommand?.key
    ? getParametersForCommand(selectedCommand.key)
    : [];
  const parameters = isGlobal
    ? globalParameters
    : selectedCommand
      ? commandParameters
      : rootParameters;

  if (parameters.length === 0) return null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          {isGlobal && <GlobeIcon className="h-5 w-5" />}
          {title} ({parameters.length})
        </h3>
      </div>
      <div className="space-y-2">
        {parameters.map((parameter) => (
          <div
            key={parameter.key}
            className="rounded border border-muted p-3"
          >
            <div className="mb-2 flex items-center gap-2">
              <ParameterIcon type={parameter.parameterType} />
              <span className="text-sm font-medium">
                {parameter.name}
                {(parameter.longFlag || parameter.shortFlag) && (
                  <span className="ml-1 text-muted-foreground">
                    ({[parameter.longFlag, parameter.shortFlag].filter(Boolean).join(", ")})
                  </span>
                )}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {parameter.isRequired && (
                <Badge
                  variant="destructive"
                  className="text-xs"
                >
                  required
                </Badge>
              )}
              <Badge
                variant="outline"
                className="text-xs"
              >
                {parameter.parameterType}
              </Badge>
              <Badge
                variant="secondary"
                className="text-xs"
              >
                {parameter.dataType}
              </Badge>
              {isGlobal && (
                <Badge
                  variant="default"
                  className="text-xs"
                >
                  global
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DemoToolEditor() {
  return (
    <ToolBuilderProvider tool={DEMO_TOOL}>
      <DemoToolEditorContent />
    </ToolBuilderProvider>
  );
}

function CompactGeneratedCommand() {
  const { tool, selectedCommand, parameterValues } = useToolBuilder();

  const command = useMemo(
    () => generateCommand(tool, parameterValues, { selectedCommand, useLongFlag: true }),
    [tool, selectedCommand, parameterValues],
  );

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 font-mono text-sm">
      <TerminalIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{command}</span>
    </div>
  );
}

function DemoToolEditorContent() {
  const { tool, selectedCommand, parameterValues, setParameterValue } = useToolBuilder();

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xl">
        <div className="flex items-center gap-2 border-b border-border/60 bg-muted/50 px-4 py-2.5">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-400/80" />
            <div className="h-3 w-3 rounded-full bg-yellow-400/80" />
            <div className="h-3 w-3 rounded-full bg-green-400/80" />
          </div>
          <span className="ml-2 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <TerminalIcon size={12} />
            commandly / {tool.displayName} ({tool.binaryName})
          </span>
        </div>

        {/* Mobile: ToolRenderer + command only */}
        <div className="flex flex-col gap-3 p-4 md:hidden">
          <div className="overflow-hidden rounded-lg border border-border/60">
            <div className="space-y-4 p-4">
              <ToolRenderer
                selectedCommand={selectedCommand}
                tool={tool}
                parameterValues={parameterValues}
                updateParameterValue={(key, value) => setParameterValue(key, value)}
              />
            </div>
          </div>
          <CompactGeneratedCommand />
        </div>

        {/* Desktop: full editor */}
        <div className="hidden h-144 md:flex">
          <div className="flex w-52 shrink-0 flex-col overflow-hidden">
            <ReadOnlyCommandTree />
          </div>

          <div className="flex min-h-0 flex-1 overflow-hidden">
            <div className="flex min-h-0 flex-1 gap-4 overflow-hidden p-4">
              <div className="min-w-64 flex-2/5 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="flex flex-col gap-4 pr-3 pb-4">
                    <ReadOnlyParameterList
                      title="Global Parameters"
                      isGlobal={true}
                    />
                    <ReadOnlyParameterList title="Command Parameters" />
                  </div>
                </ScrollArea>
              </div>
              <div className="flex h-full flex-3/5 flex-col gap-3 overflow-hidden">
                <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border/60">
                  <ScrollArea className="h-full">
                    <div className="space-y-4 p-4">
                      <ToolRenderer
                        selectedCommand={selectedCommand}
                        tool={tool}
                        parameterValues={parameterValues}
                        updateParameterValue={(key, value) => setParameterValue(key, value)}
                      />
                    </div>
                  </ScrollArea>
                </div>
                <CompactGeneratedCommand />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnimatedPipeline() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-2 sm:flex-row sm:gap-4">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-4 py-3"
      >
        <TerminalIcon className="h-5 w-5 text-muted-foreground" />
        <span className="font-mono text-sm font-medium">CLI Help Text</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="rotate-90 sm:rotate-0"
      >
        <ArrowRightIcon className="h-5 w-5 text-muted-foreground" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3"
      >
        <BracesIcon className="h-5 w-5 text-primary" />
        <span className="font-mono text-sm font-medium text-primary">JSON Definition</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
        className="rotate-90 sm:rotate-0"
      >
        <ArrowRightIcon className="h-5 w-5 text-muted-foreground" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-4 py-3"
      >
        <MonitorIcon className="h-5 w-5 text-muted-foreground" />
        <span className="font-mono text-sm font-medium">Visual UI</span>
      </motion.div>
    </div>
  );
}

const FEATURES: {
  icon: ReactNode;
  title: string;
  desc: string;
}[] = [
  {
    icon: <WrenchIcon className="h-6 w-6" />,
    title: "Visual Command Builder",
    desc: "Define commands, subcommands, flags, and arguments through a visual editor. No syntax to memorize.",
  },
  {
    icon: <BracesIcon className="h-6 w-6" />,
    title: "Structured JSON Output",
    desc: "Every tool definition is a portable JSON file, flat or nested, ready for automation, sharing, or version control.",
  },
  {
    icon: <MonitorIcon className="h-6 w-6" />,
    title: "Interactive Preview",
    desc: "Toggle parameters and see the generated command update in real-time. Test before you run.",
  },
  {
    icon: <CodeIcon className="h-6 w-6" />,
    title: "Programmatic Access",
    desc: "Use tool definitions to build wrappers, automate workflows, or integrate CLI tools into any application.",
  },
  {
    icon: <SparklesIcon className="h-6 w-6" />,
    title: "AI Parsing",
    desc: "Paste any CLI help text and let AI extract commands, flags, and descriptions into a structured definition.",
  },
  {
    icon: <TerminalIcon className="h-6 w-6" />,
    title: "Universal CLI Support",
    desc: "Works with any command-line tool: curl, ffmpeg, docker, git, kubectl, and hundreds more.",
  },
];

const COMMIT_SHA = import.meta.env.VITE_COMMIT_SHA as string | undefined;

function RouteComponent() {
  return (
    <div className="flex w-full flex-col">
      {/* ─── Hero ─── */}
      <section className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-6 py-24">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, oklch(0.5 0 0 / 20%) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.5 0 0 / 20%) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 70%)",
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,oklch(0.5_0_0/10%),transparent)]" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="z-10 mb-12 flex max-w-3xl flex-col items-center text-center"
        >
          <h1 className="mb-5 font-mono text-3xl leading-tight tracking-tight text-foreground sm:text-5xl lg:text-7xl">
            The visual layer for{" "}
            <span className="bg-linear-to-r from-foreground/90 to-foreground/50 bg-clip-text text-transparent">
              every CLI tool
            </span>
          </h1>

          <p className="mb-8 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Define any command-line tool as structured JSON. Build interactive UIs from it. Run
            tools programmatically or visually, your choice.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              className="group gap-2 rounded-xl px-8 text-base"
              asChild
            >
              <Link to="/tools">
                Get Started
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 rounded-xl px-8 text-base"
              asChild
            >
              <Link
                to="/docs/$componentName"
                params={{ componentName: "specification-intro" }}
              >
                Documentation
              </Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="z-10 w-full max-w-6xl"
        >
          <DemoToolEditor />
        </motion.div>
      </section>

      {/* ─── Tool Marquee ─── */}
      <section className="my-12 border-y border-dashed border-border">
        <div className="mx-auto w-full max-w-6xl border-dashed border-border px-4 py-16 sm:border-x sm:py-24">
          <div className="flex items-center justify-center">
            <TextMarquee
              speed={1}
              prefix={
                <span className="font-mono text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
                  commandly&nbsp;/&nbsp;
                </span>
              }
            >
              {[
                "curl",
                "git",
                "docker",
                "ssh",
                "rsync",
                "ffmpeg",
                "grep",
                "sed",
                "awk",
                "tar",
                "wget",
                "find",
                "kubectl",
                "nginx",
                "openssl",
                "jq",
                "tmux",
                "vim",
                "gcc",
                "python",
              ].map((name) => (
                <span
                  key={name}
                  className="font-mono text-2xl font-bold tracking-tight text-muted-foreground sm:text-3xl"
                >
                  {name}
                </span>
              ))}
            </TextMarquee>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="relative w-full px-6 py-20 sm:py-32">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-3 font-mono text-2xl tracking-tight text-foreground sm:text-4xl">
              CLI → JSON → UI
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Turn any command-line tool into a structured definition, then render it as an
              interactive interface, or use it programmatically.
            </p>
          </motion.div>

          <AnimatedPipeline />

          <div className="mt-12 grid gap-6 sm:mt-16 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Define",
                desc: "Describe your CLI tool with commands, flags, options, and arguments in a simple JSON format. Or paste help text and let AI do it.",
              },
              {
                step: "02",
                title: "Render",
                desc: "Commandly generates an interactive UI from the definition. Toggle parameters, fill values, see the command update live.",
              },
              {
                step: "03",
                title: "Use",
                desc: "Copy commands, export JSON definitions, integrate with your toolchain, or build automation on top of the specification.",
              },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-border/60 bg-card p-6"
              >
                <div className="mb-3 font-mono text-2xl font-bold text-muted-foreground/30">
                  {s.step}
                </div>
                <h3 className="mb-2 font-mono text-lg font-semibold tracking-tight">{s.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="relative w-full px-6 py-20 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-12 text-center sm:mb-16"
          >
            <h2 className="mb-3 font-mono text-2xl tracking-tight text-foreground sm:text-4xl">
              Everything you need
            </h2>
            <p className="text-muted-foreground">
              A complete toolkit for defining, previewing, and automating CLI tools.
            </p>
          </motion.div>

          <div
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            style={{ perspective: "1200px" }}
          >
            {FEATURES.map((f, i) => (
              <IsometricCard
                key={f.title}
                delay={i * 0.08}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-border/40 bg-muted/30 text-foreground">
                  {f.icon}
                </div>
                <h3 className="mb-1.5 font-mono text-sm font-semibold tracking-tight">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </IsometricCard>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Built for Developers ─── */}
      <section className="relative w-full border-y border-border/40 px-6 py-20 sm:py-32">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-3 font-mono text-2xl tracking-tight text-foreground sm:text-4xl">
              Built for developers
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Not just a pretty interface. Commandly gives you structured data you can build on top
              of.
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2">
            {[
              {
                title: "Open Specification",
                desc: "The Commandly JSON specification is open and documented. Build your own renderers, validators, or integrations.",
              },
              {
                title: "Embeddable Components",
                desc: "Drop ToolRenderer or GeneratedCommand into your own React app. Every component is published as a registry block.",
              },
              {
                title: "MCP Server",
                desc: "Commandly ships an MCP server so AI assistants and agents can discover and call CLI tools programmatically.",
              },
              {
                title: "Community Tools",
                desc: "Browse and contribute tool definitions for popular CLI tools. Fork, customize, and share with the community.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-xl border border-border/60 bg-card p-6"
              >
                <h3 className="mb-2 font-mono text-sm font-semibold tracking-tight">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="w-full px-6 py-16 sm:py-24">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <h2 className="mb-4 font-mono text-2xl tracking-tight text-foreground sm:text-4xl">
            Ready to build?
          </h2>
          <p className="mb-8 text-muted-foreground">
            Define your first CLI tool in minutes, visually or from help text.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              className="group gap-2 rounded-xl px-5 text-base"
              asChild
            >
              <Link to="/tools">
                Launch Commandly
                <ArrowRightIcon className="h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 rounded-xl px-8 text-base"
              asChild
            >
              <a
                href="https://github.com/divyeshio/commandly"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitMergeIcon className="h-4 w-4" />
                View on GitHub
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="w-full border-t border-border/60 px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2 font-mono text-sm text-muted-foreground">
            <TerminalIcon size={14} />
            <span>Commandly</span>
            <span className="text-border">·</span>
            <span>© {new Date().getFullYear()}</span>
            {COMMIT_SHA && (
              <>
                <span className="text-border">·</span>
                <a
                  href={`https://github.com/divyeshio/commandly/commit/${COMMIT_SHA}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 transition-colors hover:text-foreground"
                >
                  <GitMergeIcon size={11} />
                  {COMMIT_SHA.slice(0, 7)}
                </a>
              </>
            )}
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a
              href="https://github.com/divyeshio/commandly"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              GitHub
            </a>
            <a
              href="https://twitter.com/divyeshio"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              Twitter
            </a>
            <a
              href="https://linkedin.com/in/divyeshio"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
