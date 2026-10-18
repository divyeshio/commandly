import type { Command, Parameter, ParameterValue, Tool } from "@/components/commandly/types/tool";
import {
  excludedParameters,
  getAllParameters,
  getCommandPath,
  getDefaultCommand,
  hasParameterValue,
  resolveApplicableParameters,
  resolveExclusionGroups,
} from "@/components/commandly/utils/tool";

export interface GenerateCommandOptions {
  selectedCommand?: Command | null;
  /** Index into a parameter's flag forms to emit; falls back to the canonical form. */
  flagFormIndex?: number;
}

/**
 * The full flag for a parameter. For `Flag` and `Option` types this is the key itself, which
 * carries its own dashes (e.g. "--output", "-list"). Positional arguments have no flag.
 */
export const getCanonicalFlag = (param: Parameter): string => param.key;

/** Every form that invokes a parameter: the full flag first, then its short and other names. */
export const getFlagForms = (param: Parameter): string[] => {
  if (param.parameterType === "Argument") return [];
  const forms = [param.key, ...(param.aliases ?? [])];
  return forms.filter((form, index) => forms.indexOf(form) === index);
};

/** The highest number of flag forms any parameter offers: its canonical flag plus its aliases. */
export const getFlagFormCount = (tool: Tool): number =>
  getAllParameters(tool).reduce((max, param) => Math.max(max, getFlagForms(param).length), 0);

/** Labels for the flag positions: position 0 is the parameter's own key, the rest are its aliases. */
const FLAG_FORM_LABELS = ["Full name", "Short name"];

/** One label per flag position any parameter of the tool offers. */
export const getToolFlagForms = (tool: Tool): string[] =>
  Array.from(
    { length: getFlagFormCount(tool) },
    (_, index) => FLAG_FORM_LABELS[index] ?? `Alternate ${index}`,
  );

export function generateCommand(
  tool: Tool,
  parameterValues: Record<string, ParameterValue>,
  options: GenerateCommandOptions = {},
): string {
  const hasCommands = tool.commands.length > 0;
  const selectedCommand =
    options.selectedCommand === undefined ? getDefaultCommand(tool) : options.selectedCommand;
  const flagFormIndex = options.flagFormIndex ?? 0;

  let command = tool.binaryName;

  if (hasCommands && selectedCommand) {
    const commandPath = getCommandPath(selectedCommand, tool);
    if (tool.binaryName !== commandPath) {
      command = `${tool.binaryName} ${commandPath}`;
    }
  }

  const excluded = excludedParameters(
    resolveExclusionGroups(tool, selectedCommand),
    parameterValues,
  );

  const parametersWithValues = resolveApplicableParameters(tool, selectedCommand)
    .filter((param) => !excluded.has(param.key))
    .map((param) => ({ param, value: parameterValues[param.key] }))
    .filter(({ value }) => hasParameterValue(value));

  const positionalParams = parametersWithValues
    .filter(({ param }) => param.parameterType === "Argument")
    .sort((a, b) => (a.param.position || 0) - (b.param.position || 0));

  parametersWithValues.forEach(({ param, value }) => {
    if (param.parameterType === "Flag") {
      const flag = getFlagForms(param)[flagFormIndex] ?? getCanonicalFlag(param);
      if (value === true) {
        command += ` ${flag}`;
      } else if (param.isRepeatable && typeof value === "number" && value > 0) {
        command += ` ${flag}`.repeat(value);
      }
      return;
    }

    if (param.parameterType === "Option") {
      const flag = getFlagForms(param)[flagFormIndex] ?? getCanonicalFlag(param);

      const separator = param.keyValueSeparator ?? " ";
      if (Array.isArray(value)) {
        const entries = value.filter((entry) => entry !== "");
        if (entries.length === 0) return;

        if (param.arraySeparator) {
          command += ` ${flag}${separator}${entries.join(param.arraySeparator)}`;
          return;
        }

        entries.forEach((entry) => {
          command += ` ${flag}${separator}${entry}`;
        });
        return;
      }

      command += ` ${flag}${separator}${value}`;
    }
  });

  positionalParams.forEach(({ value }) => {
    if (!Array.isArray(value)) {
      command += ` ${value}`;
    }
  });

  return command;
}
