import type {
  Command,
  ExclusionGroup,
  Parameter,
  ParameterDependency,
  ParameterEnumValue,
  ParameterValidation,
  Tool,
} from "@/registry/commandly/lib/types/commandly";
import { slugify } from "@/registry/commandly/lib/utils/commandly";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function replaceKey(tool: Tool): Tool {
  // Deep clone the tool to avoid mutating the original
  const clone = JSON.parse(JSON.stringify(tool));

  // Remove the tool ID if it exists
  if (clone.id) delete clone.id;

  // First pass: collect all old->new key mappings
  const keyMap: Record<string, string> = {};

  function mapKey(oldKey: string, newKey: string): string {
    if (!oldKey) return "";
    keyMap[oldKey] = newKey;
    return keyMap[oldKey];
  }

  // Map command keys (handle commandId as well during migration)
  clone.commands.forEach((cmd: Command) => {
    const oldKey = cmd.key;
    mapKey(oldKey, slugify(cmd.name));
  });

  // Map parameter keys
  clone.parameters.forEach((param: Parameter) => {
    const oldKey = param.key;
    mapKey(oldKey, slugify(param.longFlag || param.name));

    if (param.enumValues) {
      param.enumValues.forEach((ev: ParameterEnumValue) => {
        const oldEvKey = ev.key;
        mapKey(oldEvKey, slugify(ev.value));
      });
    }

    if (param.validations) {
      param.validations.forEach((val: ParameterValidation) => {
        const oldValKey = val.key;
        mapKey(oldValKey, slugify(`${val.validationType}-${val.validationValue}`));
      });
    }

    if (param.dependencies) {
      param.dependencies.forEach((dep: ParameterDependency) => {
        const oldDepKey = dep.key;
        const dependsOnKey = dep.dependsOnParameterKey;
        mapKey(oldDepKey, slugify(`dep-${oldKey}-${dependsOnKey}`));
      });
    }
  });

  // Map exclusion group keys
  if (clone.exclusionGroups) {
    clone.exclusionGroups.forEach((group: ExclusionGroup) => {
      const oldKey = group.key;
      if (oldKey) mapKey(oldKey, slugify(group.name));
    });
  }

  // Second pass: replace keys and references
  clone.commands = clone.commands.map((cmd: Command) => {
    const oldKey = cmd.key;
    const parentKey = cmd.parentCommandKey;
    return {
      ...cmd,
      id: undefined,
      key: keyMap[oldKey] || oldKey,
      parentCommandKey: parentKey ? keyMap[parentKey] || parentKey : undefined,
      parentCommandId: undefined,
    };
  });

  clone.parameters = clone.parameters.map((param: Parameter) => {
    const oldKey = param.key;
    const commandKey = param.commandKey;

    const newParam = {
      ...param,
      id: undefined,
      key: keyMap[oldKey] || oldKey,
      commandKey: commandKey ? keyMap[commandKey] || commandKey : undefined,
      commandId: undefined,
      enumValues: (param.enumValues || []).map((ev: ParameterEnumValue) => {
        const oldEvKey = ev.key;
        const oldParamKey = ev.parameterKey;
        return {
          ...ev,
          id: undefined,
          key: keyMap[oldEvKey] || oldEvKey,
          parameterKey: keyMap[oldParamKey] || oldParamKey,
          parameterId: undefined,
        };
      }),
      validations: (param.validations || []).map((val: ParameterValidation) => {
        const oldValKey = val.key;
        const oldParamKey = val.parameterKey;
        return {
          ...val,
          id: undefined,
          key: keyMap[oldValKey] || oldValKey,
          parameterKey: keyMap[oldParamKey] || oldParamKey,
          parameterId: undefined,
        };
      }),
      dependencies: (param.dependencies || []).map((dep: ParameterDependency) => {
        const oldDepKey = dep.key;
        const oldParamKey = dep.parameterKey;
        const dependsOnKey = dep.dependsOnParameterKey;
        return {
          ...dep,
          id: undefined,
          key: keyMap[oldDepKey] || oldDepKey,
          parameterKey: keyMap[oldParamKey] || oldParamKey,
          parameterId: undefined,
          dependsOnParameterKey: keyMap[dependsOnKey] || dependsOnKey,
          dependsOnParameterId: undefined,
        };
      }),
    };
    return newParam;
  });

  if (clone.exclusionGroups) {
    clone.exclusionGroups = clone.exclusionGroups.map((group: ExclusionGroup) => {
      const oldKey = group.key;
      const commandKey = group.commandKey;
      const parameterKeys = group.parameterKeys || [];

      return {
        ...group,
        id: undefined,
        key: oldKey ? keyMap[oldKey] || oldKey : undefined,
        commandKey: commandKey ? keyMap[commandKey] || commandKey : undefined,
        commandId: undefined,
        parameterKeys: parameterKeys.map((pk: string) => keyMap[pk] || pk),
        parameterIds: undefined,
      };
    });
  }

  // Clean up any remaining undefined fields from the spread
  const finalClone = JSON.parse(JSON.stringify(clone));
  return finalClone;
}
