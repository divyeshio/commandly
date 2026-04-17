import { ParameterValue, Tool, Command } from "@/components/commandly/types/flat";
import { generateCommand } from "@/components/commandly/utils/flat";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { TerminalIcon, CopyIcon, SaveIcon } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { toast } from "sonner";

interface GeneratedCommandProps {
  tool: Tool;
  selectedCommand?: Command | null;
  parameterValues: Record<string, ParameterValue>;
  onSaveCommand?: (command: string) => void;
  useLongFlag?: boolean;
  children?: ReactNode;
}

interface GeneratedCommandContextValue {
  generatedCommand: string;
  useLongFlag: boolean;
  setUseLongFlag: (value: boolean) => void;
  supportsFlagPreference: boolean;
  onCopyCommand: () => void;
  onSaveCommand?: (command: string) => void;
}

const GeneratedCommandContext = createContext<GeneratedCommandContextValue | null>(null);

function useGeneratedCommandContext() {
  const context = useContext(GeneratedCommandContext);

  if (!context) {
    throw new Error("GeneratedCommand compound components must be used within GeneratedCommand.");
  }

  return context;
}

function GeneratedCommandRoot({
  tool,
  selectedCommand: providedCommand,
  parameterValues,
  onSaveCommand,
  useLongFlag = false,
  children,
}: GeneratedCommandProps) {
  const [prefersLongFlag, setPrefersLongFlag] = useState(useLongFlag);
  const supportsFlagPreference = useMemo(
    () =>
      tool.parameters.some(
        (parameter) =>
          parameter.parameterType !== "Argument" &&
          Boolean(parameter.shortFlag) &&
          Boolean(parameter.longFlag),
      ),
    [tool.parameters],
  );

  useEffect(() => {
    setPrefersLongFlag(useLongFlag);
  }, [useLongFlag]);

  const generatedCommand = useMemo(
    () =>
      generateCommand(tool, parameterValues, {
        selectedCommand: providedCommand,
        useLongFlag: prefersLongFlag,
      }),
    [tool, parameterValues, providedCommand, prefersLongFlag],
  );

  const copyCommand = useCallback(() => {
    navigator.clipboard.writeText(generatedCommand);
    toast("Command copied!");
  }, [generatedCommand]);

  const contextValue = useMemo(
    () => ({
      generatedCommand,
      useLongFlag: prefersLongFlag,
      setUseLongFlag: setPrefersLongFlag,
      supportsFlagPreference,
      onCopyCommand: copyCommand,
      onSaveCommand,
    }),
    [generatedCommand, prefersLongFlag, supportsFlagPreference, copyCommand, onSaveCommand],
  );

  return (
    <GeneratedCommandContext.Provider value={contextValue}>
      {generatedCommand ? (
        (children ?? (
          <div className="min-w-0 space-y-4">
            <GeneratedCommandOutput />
            <GeneratedCommandActions />
          </div>
        ))
      ) : (
        <GeneratedCommandEmptyState />
      )}
    </GeneratedCommandContext.Provider>
  );
}

function GeneratedCommandToolbar({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-wrap items-center justify-end gap-2", className)}
      {...props}
    />
  );
}

function GeneratedCommandHeader({
  children,
  className,
  ...props
}: ComponentProps<typeof CardHeader>) {
  return (
    <CardHeader
      className={cn("flex flex-row items-center justify-between gap-3 space-y-0", className)}
      {...props}
    >
      <CardTitle className="flex items-center gap-2">
        <TerminalIcon className="h-5 w-5" />
        Generated Command
      </CardTitle>
      {children}
    </CardHeader>
  );
}

function GeneratedCommandFlagPreference({
  className,
  ...props
}: Omit<ComponentProps<typeof Switch>, "checked" | "onCheckedChange">) {
  const { supportsFlagPreference, useLongFlag, setUseLongFlag } = useGeneratedCommandContext();

  if (!supportsFlagPreference) return null;

  return (
    <Label className="shrink-0 gap-2 text-xs text-muted-foreground">
      <span className="font-mono tracking-[0.12em] uppercase">Long flags</span>
      <Switch
        checked={useLongFlag}
        onCheckedChange={setUseLongFlag}
        aria-label="Long flags"
        className={className}
        {...props}
      />
    </Label>
  );
}

function GeneratedCommandOutput({ className, ...props }: ComponentProps<"div">) {
  const { generatedCommand } = useGeneratedCommandContext();

  return (
    <div
      className={cn("overflow-x-auto rounded bg-muted p-4 font-mono text-sm", className)}
      {...props}
    >
      <div className="min-w-max whitespace-nowrap">{generatedCommand}</div>
    </div>
  );
}

function GeneratedCommandActions({ className, ...props }: ComponentProps<"div">) {
  const { generatedCommand, onCopyCommand, onSaveCommand } = useGeneratedCommandContext();

  return (
    <div
      className={cn("flex flex-col gap-2 sm:flex-row", className)}
      {...props}
    >
      <Button
        onClick={onCopyCommand}
        variant="outline"
        className="w-full sm:flex-1"
      >
        <CopyIcon className="mr-2 h-4 w-4" />
        Copy Command
      </Button>
      {onSaveCommand && (
        <Button
          onClick={() => onSaveCommand(generatedCommand)}
          variant="outline"
          className="w-full sm:flex-1"
        >
          <SaveIcon className="mr-2 h-4 w-4" />
          Save Command
        </Button>
      )}
    </div>
  );
}

function GeneratedCommandEmptyState() {
  return (
    <div className="py-8 text-center">
      <TerminalIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
      <p className="text-muted-foreground">Configure parameters to generate the command.</p>
    </div>
  );
}

export const GeneratedCommand = Object.assign(GeneratedCommandRoot, {
  Header: GeneratedCommandHeader,
  Toolbar: GeneratedCommandToolbar,
  FlagPreference: GeneratedCommandFlagPreference,
  Output: GeneratedCommandOutput,
  Actions: GeneratedCommandActions,
  EmptyState: GeneratedCommandEmptyState,
});
