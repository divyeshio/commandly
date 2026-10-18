import { ParameterValue, Tool, Command } from "@/components/commandly/types/tool";
import { writeClipboard } from "@/components/commandly/utils/clipboard";
import { generateCommand, getToolFlagForms } from "@/components/commandly/utils/generate-command";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TerminalIcon, CopyIcon, SaveIcon } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
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
  /** Position emitted by default: 0 is a parameter's full flag, later positions its aliases. */
  defaultFlagFormIndex?: number;
  children?: ReactNode;
}

interface FlagFormOption {
  index: number;
  label: string;
}

interface GeneratedCommandContextValue {
  generatedCommand: string;
  flagFormIndex: number;
  setFlagFormIndex: (value: number) => void;
  flagFormOptions: FlagFormOption[];
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
  defaultFlagFormIndex = 0,
  children,
}: GeneratedCommandProps) {
  const [flagFormIndex, setFlagFormIndex] = useState(defaultFlagFormIndex);

  const flagFormOptions = useMemo<FlagFormOption[]>(
    () => getToolFlagForms(tool).map((label, index) => ({ index, label })),
    [tool],
  );

  const generatedCommand = useMemo(
    () =>
      generateCommand(tool, parameterValues, {
        selectedCommand: providedCommand,
        flagFormIndex,
      }),
    [tool, parameterValues, providedCommand, flagFormIndex],
  );

  const copyCommand = useCallback(() => {
    writeClipboard(generatedCommand).then(
      () => toast("Command copied!"),
      () => toast.error("Copy failed"),
    );
  }, [generatedCommand]);

  const contextValue = useMemo(
    () => ({
      generatedCommand,
      flagFormIndex,
      setFlagFormIndex,
      flagFormOptions,
      onCopyCommand: copyCommand,
      onSaveCommand,
    }),
    [generatedCommand, flagFormIndex, flagFormOptions, copyCommand, onSaveCommand],
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

function GeneratedCommandFlagFormPreference({
  className,
  ...props
}: Omit<ComponentProps<typeof SelectTrigger>, "value" | "onValueChange">) {
  const { flagFormIndex, setFlagFormIndex, flagFormOptions } = useGeneratedCommandContext();

  if (flagFormOptions.length < 2) return null;

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Label className="font-mono text-xs tracking-[0.12em] text-muted-foreground uppercase">
        Flag style
      </Label>
      <Select
        value={String(flagFormIndex)}
        onValueChange={(value) => setFlagFormIndex(Number(value))}
      >
        <SelectTrigger
          className={cn("h-8 w-36", className)}
          aria-label="Flag style"
          {...props}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {flagFormOptions.map((option) => (
            <SelectItem
              key={option.index}
              value={String(option.index)}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
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
  FlagFormPreference: GeneratedCommandFlagFormPreference,
  Output: GeneratedCommandOutput,
  Actions: GeneratedCommandActions,
  EmptyState: GeneratedCommandEmptyState,
});
