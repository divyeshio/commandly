import type { Tool, Parameter, Command, ExclusionGroup } from "@/components/commandly/types/tool";

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

function validateParameter(
  param: Parameter,
  index: number,
  siblingKeys: Set<string>,
  path = `parameters[${index}]`,
): ToolValidationError[] {
  const errors: ToolValidationError[] = [];

  if (!param.displayName) {
    errors.push({
      path: `${path}.displayName`,
      message: `Parameter "${param.key}" has no displayName`,
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
    for (let j = 0; j < param.dependencies.length; j++) {
      const dep = param.dependencies[j];
      if (!siblingKeys.has(dep.dependsOnParameterKey)) {
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

function validateCommand(
  cmd: Command,
  path: string,
  errors: ToolValidationError[],
  seenCommandKeys: Map<string, string>,
): void {
  if (!cmd.displayName) {
    errors.push({
      path: `${path}.displayName`,
      message: `Command "${cmd.key}" has no displayName`,
      severity: "error",
    });
  }

  if (!cmd.key) {
    errors.push({
      path: `${path}.key`,
      message: `Command at ${path} has no key`,
      severity: "error",
    });
  } else {
    const firstSeenAt = seenCommandKeys.get(cmd.key);
    if (firstSeenAt !== undefined) {
      errors.push({
        path: `${path}.key`,
        message: `Duplicate command key "${cmd.key}" (first at ${firstSeenAt})`,
        severity: "error",
      });
    } else {
      seenCommandKeys.set(cmd.key, path);
    }
  }

  const parameters = cmd.parameters ?? [];
  errors.push(...checkUniqueKeys(parameters, "Parameter", `${path}.parameters`));
  const siblingKeys = new Set(parameters.map((p) => p.key));
  for (let i = 0; i < parameters.length; i++) {
    errors.push(...validateParameter(parameters[i], i, siblingKeys, `${path}.parameters[${i}]`));
  }

  if (cmd.exclusionGroups && cmd.exclusionGroups.length > 0) {
    errors.push(
      ...validateExclusionGroups(cmd.exclusionGroups, siblingKeys, `${path}.exclusionGroups`),
    );
  }

  const subcommands = cmd.commands ?? [];
  for (let i = 0; i < subcommands.length; i++) {
    validateCommand(subcommands[i], `${path}.commands[${i}]`, errors, seenCommandKeys);
  }
}

function validateExclusionGroups(
  groups: ExclusionGroup[],
  paramKeys: Set<string>,
  pathPrefix: string,
): ToolValidationError[] {
  const errors: ToolValidationError[] = [];

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const path = `${pathPrefix}[${i}]`;

    if (!group.displayName) {
      errors.push({
        path: `${path}.displayName`,
        message: `Exclusion group at index ${i} has no name`,
        severity: "error",
      });
    }

    if (!group.parameterKeys || group.parameterKeys.length < 2) {
      errors.push({
        path: `${path}.parameterKeys`,
        message: `Exclusion group "${group.displayName}" must reference at least 2 parameters`,
        severity: "error",
      });
    } else {
      for (const pk of group.parameterKeys) {
        if (!paramKeys.has(pk)) {
          errors.push({
            path: `${path}.parameterKeys`,
            message: `Exclusion group "${group.displayName}" references non-existent parameter "${pk}"`,
            severity: "error",
          });
        }
      }
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
    const seenCommandKeys = new Map<string, string>();
    for (let i = 0; i < tool.commands.length; i++) {
      validateCommand(tool.commands[i], `commands[${i}]`, errors, seenCommandKeys);
    }
  }

  if (!Array.isArray(tool.parameters)) {
    errors.push({ path: "parameters", message: "parameters must be an array", severity: "error" });
  } else {
    errors.push(...checkUniqueKeys(tool.parameters, "Parameter", "parameters"));
    const rootKeys = new Set(tool.parameters.map((p) => p.key));
    for (let i = 0; i < tool.parameters.length; i++) {
      errors.push(...validateParameter(tool.parameters[i], i, rootKeys));
    }

    if (tool.exclusionGroups && tool.exclusionGroups.length > 0) {
      errors.push(...validateExclusionGroups(tool.exclusionGroups, rootKeys, "exclusionGroups"));
    }
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
