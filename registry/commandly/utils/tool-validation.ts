import type { Tool, Parameter, Command, ExclusionGroup } from "@/components/commandly/types/flat";

export type ValidationSeverity = "error" | "warning";

export interface ToolValidationError {
  path: string;
  message: string;
  severity: ValidationSeverity;
}

function checkUniqueKeys(
  items: { key: string }[],
  label: string,
  pathPrefix: string,
): ToolValidationError[] {
  const errors: ToolValidationError[] = [];
  const seen = new Map<string, number>();

  for (let i = 0; i < items.length; i++) {
    const key = items[i].key;
    if (!key) {
      errors.push({
        path: `${pathPrefix}[${i}].key`,
        message: `${label} at index ${i} has an empty key`,
        severity: "error",
      });
      continue;
    }
    const prev = seen.get(key);
    if (prev !== undefined) {
      errors.push({
        path: `${pathPrefix}[${i}].key`,
        message: `Duplicate ${label.toLowerCase()} key "${key}" (first at index ${prev})`,
        severity: "error",
      });
    } else {
      seen.set(key, i);
    }
  }
  return errors;
}

function validateParameter(param: Parameter, index: number, tool: Tool): ToolValidationError[] {
  const errors: ToolValidationError[] = [];
  const path = `parameters[${index}]`;
  const hasCommands = tool.commands.length > 0;

  if (!param.name) {
    errors.push({
      path: `${path}.name`,
      message: `Parameter "${param.key}" has no name`,
      severity: "error",
    });
  }

  if (!param.parameterType) {
    errors.push({
      path: `${path}.parameterType`,
      message: `Parameter "${param.key}" has no parameterType`,
      severity: "error",
    });
  }

  if (!param.dataType) {
    errors.push({
      path: `${path}.dataType`,
      message: `Parameter "${param.key}" has no dataType`,
      severity: "error",
    });
  }

  if (param.parameterType === "Flag" && param.dataType !== "Boolean") {
    errors.push({
      path: `${path}.dataType`,
      message: `Flag "${param.key}" should have dataType "Boolean" but has "${param.dataType}"`,
      severity: "warning",
    });
  }

  if (hasCommands && !param.commandKey && !param.isGlobal) {
    errors.push({
      path: `${path}`,
      message: `Parameter "${param.key}" must have commandKey or isGlobal when commands exist`,
      severity: "error",
    });
  }

  if (!hasCommands && (param.commandKey || param.isGlobal)) {
    errors.push({
      path: `${path}`,
      message: `Parameter "${param.key}" must not have commandKey or isGlobal when there are no commands`,
      severity: "error",
    });
  }

  if (param.isGlobal && param.commandKey) {
    errors.push({
      path: `${path}`,
      message: `Parameter "${param.key}" has both isGlobal and commandKey - global parameters must not have commandKey`,
      severity: "error",
    });
  }

  if (param.commandKey && !tool.commands.some((c) => c.key === param.commandKey)) {
    errors.push({
      path: `${path}.commandKey`,
      message: `Parameter "${param.key}" references non-existent command "${param.commandKey}"`,
      severity: "error",
    });
  }

  if (param.dataType === "Enum") {
    if (!param.enum || param.enum.values.length === 0) {
      errors.push({
        path: `${path}.enum`,
        message: `Enum parameter "${param.key}" has no enum values`,
        severity: "error",
      });
    } else {
      for (let j = 0; j < param.enum.values.length; j++) {
        const ev = param.enum.values[j];
        if (!ev.value) {
          errors.push({
            path: `${path}.enum.values[${j}].value`,
            message: `Enum value at index ${j} in parameter "${param.key}" has no value`,
            severity: "error",
          });
        }
        if (!ev.displayName) {
          errors.push({
            path: `${path}.enum.values[${j}].displayName`,
            message: `Enum value "${ev.value}" in parameter "${param.key}" has no displayName`,
            severity: "error",
          });
        }
      }
    }
  }

  if (param.validations) {
    const valKeys = new Set<string>();
    for (let j = 0; j < param.validations.length; j++) {
      const v = param.validations[j];
      if (valKeys.has(v.key)) {
        errors.push({
          path: `${path}.validations[${j}].key`,
          message: `Duplicate validation key "${v.key}" in parameter "${param.key}"`,
          severity: "error",
        });
      }
      valKeys.add(v.key);
    }
  }

  if (param.dependencies) {
    const paramKeys = new Set(tool.parameters.map((p) => p.key));
    for (let j = 0; j < param.dependencies.length; j++) {
      const dep = param.dependencies[j];
      if (!paramKeys.has(dep.dependsOnParameterKey)) {
        errors.push({
          path: `${path}.dependencies[${j}].dependsOnParameterKey`,
          message: `Dependency in "${param.key}" references non-existent parameter "${dep.dependsOnParameterKey}"`,
          severity: "error",
        });
      }
    }
  }

  return errors;
}

function validateCommand(cmd: Command, index: number, tool: Tool): ToolValidationError[] {
  const errors: ToolValidationError[] = [];
  const path = `commands[${index}]`;

  if (!cmd.name) {
    errors.push({
      path: `${path}.name`,
      message: `Command "${cmd.key}" has no name`,
      severity: "error",
    });
  }

  if (cmd.parentCommandKey && !tool.commands.some((c) => c.key === cmd.parentCommandKey)) {
    errors.push({
      path: `${path}.parentCommandKey`,
      message: `Command "${cmd.key}" references non-existent parent command "${cmd.parentCommandKey}"`,
      severity: "error",
    });
  }

  return errors;
}

function validateExclusionGroups(groups: ExclusionGroup[], tool: Tool): ToolValidationError[] {
  const errors: ToolValidationError[] = [];
  const paramKeys = new Set(tool.parameters.map((p) => p.key));

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const path = `exclusionGroups[${i}]`;

    if (!group.name) {
      errors.push({
        path: `${path}.name`,
        message: `Exclusion group at index ${i} has no name`,
        severity: "error",
      });
    }

    if (!group.parameterKeys || group.parameterKeys.length < 2) {
      errors.push({
        path: `${path}.parameterKeys`,
        message: `Exclusion group "${group.name}" must reference at least 2 parameters`,
        severity: "error",
      });
    } else {
      for (const pk of group.parameterKeys) {
        if (!paramKeys.has(pk)) {
          errors.push({
            path: `${path}.parameterKeys`,
            message: `Exclusion group "${group.name}" references non-existent parameter "${pk}"`,
            severity: "error",
          });
        }
      }
    }

    if (group.commandKey && !tool.commands.some((c) => c.key === group.commandKey)) {
      errors.push({
        path: `${path}.commandKey`,
        message: `Exclusion group "${group.name}" references non-existent command "${group.commandKey}"`,
        severity: "error",
      });
    }
  }

  return errors;
}

export function validateTool(tool: Tool): ToolValidationError[] {
  const errors: ToolValidationError[] = [];

  if (!tool.binaryName) {
    errors.push({ path: "binaryName", message: "Tool has no binaryName", severity: "error" });
  }

  if (!tool.displayName) {
    errors.push({ path: "displayName", message: "Tool has no displayName", severity: "error" });
  }

  if (!Array.isArray(tool.commands)) {
    errors.push({ path: "commands", message: "commands must be an array", severity: "error" });
  } else {
    errors.push(...checkUniqueKeys(tool.commands, "Command", "commands"));
    for (let i = 0; i < tool.commands.length; i++) {
      errors.push(...validateCommand(tool.commands[i], i, tool));
    }
  }

  if (!Array.isArray(tool.parameters)) {
    errors.push({ path: "parameters", message: "parameters must be an array", severity: "error" });
  } else {
    errors.push(...checkUniqueKeys(tool.parameters, "Parameter", "parameters"));
    for (let i = 0; i < tool.parameters.length; i++) {
      errors.push(...validateParameter(tool.parameters[i], i, tool));
    }
  }

  if (tool.exclusionGroups && tool.exclusionGroups.length > 0) {
    errors.push(...validateExclusionGroups(tool.exclusionGroups, tool));
  }

  if ("description" in tool && !(tool as Record<string, unknown>)["info"]) {
    errors.push({
      path: "description",
      message: "Tool description should be nested under info object, not at top level",
      severity: "warning",
    });
  }

  if ("version" in tool && !(tool as Record<string, unknown>)["info"]) {
    errors.push({
      path: "version",
      message: "Tool version should be nested under info object, not at top level",
      severity: "warning",
    });
  }

  return errors;
}

export function formatValidationErrors(errors: ToolValidationError[]): string {
  if (errors.length === 0) return "";
  return errors
    .map((e) => `${e.severity === "error" ? "❌" : "⚠️"} ${e.path}: ${e.message}`)
    .join("\n");
}

export function hasErrors(errors: ToolValidationError[]): boolean {
  return errors.some((e) => e.severity === "error");
}
