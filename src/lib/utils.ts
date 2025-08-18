import { Tool } from "@/registry/commandly/lib/types/commandly";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { v7 as uuidv7 } from "uuid";


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


export function replaceId(tool: Tool): Tool {
  // Deep clone the tool to avoid mutating the original
  const clone: Tool = JSON.parse(JSON.stringify(tool));

  // First pass: collect all old->new id mappings
  const idMap: Record<string, string> = {};

  function mapId(oldId?: string | null): string {
    if (!oldId) return "";
    if (!idMap[oldId]) idMap[oldId] = uuidv7();
    return idMap[oldId];
  }

  // Map tool id
  if (clone.id) {
    idMap[clone.id] = uuidv7();
  }

  // Map command ids
  clone.commands.forEach(cmd => {
    idMap[cmd.id] = uuidv7();
    if (cmd.parentCommandId) idMap[cmd.parentCommandId] = uuidv7();
  });

  // Map parameter ids
  clone.parameters.forEach(param => {
    idMap[param.id] = uuidv7();
    if (param.commandId) idMap[param.commandId] = uuidv7();
    param.enumValues.forEach(ev => {
      idMap[ev.id] = uuidv7();
      idMap[ev.parameterId] = uuidv7();
    });
    param.validations?.forEach(val => {
      idMap[val.id] = uuidv7();
      idMap[val.parameterId] = uuidv7();
    });
    param.dependencies?.forEach(dep => {
      idMap[dep.id] = uuidv7();
      idMap[dep.parameterId] = uuidv7();
      idMap[dep.dependsOnParameterId] = uuidv7();
    });
  });

  // Map exclusion group ids
  clone.exclusionGroups.forEach(group => {
    if (group.id) idMap[group.id] = uuidv7();
    if (group.commandId) idMap[group.commandId] = uuidv7();
    group.parameterIds.forEach(pid => {
      idMap[pid] = uuidv7();
    });
  });

  // Second pass: replace ids and references
  if (clone.id) clone.id = mapId(clone.id);

  clone.commands = clone.commands.map(cmd => {
    const newId = mapId(cmd.id);
    const newParentId = cmd.parentCommandId ? mapId(cmd.parentCommandId) : undefined;
    return {
      ...cmd,
      id: newId as string,
      ...(newParentId ? { parentCommandId: newParentId as string } : {}),
    };
  });

  clone.parameters = clone.parameters.map(param => {
    const newId = mapId(param.id);
    const newCommandId = param.commandId ? mapId(param.commandId) : undefined;
    return {
      ...param,
      id: newId as string,
      ...(newCommandId ? { commandId: newCommandId as string } : {}),
      enumValues: param.enumValues.map(ev => ({
        ...ev,
        id: mapId(ev.id) as string,
        parameterId: mapId(ev.parameterId) as string,
      })),
      validations: param.validations?.map(val => ({
        ...val,
        id: mapId(val.id) as string,
        parameterId: mapId(val.parameterId) as string,
      })),
      dependencies: param.dependencies?.map(dep => ({
        ...dep,
        id: mapId(dep.id) as string,
        parameterId: mapId(dep.parameterId) as string,
        dependsOnParameterId: mapId(dep.dependsOnParameterId) as string,
      })),
    };
  });

  clone.exclusionGroups = clone.exclusionGroups.map(group => {
    const newId = group.id ? mapId(group.id) : undefined;
    const newCommandId = group.commandId ? mapId(group.commandId) : undefined;
    const newParameterIds = group.parameterIds.map(pid => mapId(pid) as string).filter(Boolean) as string[];
    return {
      ...group,
      ...(newId ? { id: newId as string } : {}),
      ...(newCommandId ? { commandId: newCommandId as string } : {}),
      parameterIds: newParameterIds,
    };
  });

  return clone;
}