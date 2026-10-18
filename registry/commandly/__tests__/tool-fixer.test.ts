import type { Tool, Parameter } from "@/components/commandly/types/tool";
import { fixTool, SCHEMA_URL } from "@/components/commandly/utils/tool-file";

function baseTool(overrides?: Partial<Tool>): Tool {
  return {
    binaryName: "test-tool",
    displayName: "Test Tool",
    commands: [],
    parameters: [],
    ...overrides,
  };
}

function baseParam(overrides?: Partial<Parameter>): Parameter {
  return {
    key: "param-1",
    displayName: "Param 1",
    parameterType: "Option",
    dataType: "String",
    ...overrides,
  };
}

describe("fixTool", () => {
  it("removes isRequired: false from parameters", () => {
    const tool = baseTool({
      parameters: [baseParam({ key: "p1", isRequired: false })],
    });
    const fixed = fixTool(tool);
    expect(fixed.parameters[0]).not.toHaveProperty("isRequired");
  });

  it("preserves isRequired: true", () => {
    const tool = baseTool({
      parameters: [baseParam({ key: "p1", isRequired: true })],
    });
    const fixed = fixTool(tool);
    expect(fixed.parameters[0].isRequired).toBe(true);
  });

  it("removes isRepeatable: false from parameters", () => {
    const tool = baseTool({
      parameters: [baseParam({ key: "p1", isRepeatable: false })],
    });
    const fixed = fixTool(tool);
    expect(fixed.parameters[0]).not.toHaveProperty("isRepeatable");
  });

  it("removes recursive: false from parameters", () => {
    const tool = baseTool({
      parameters: [baseParam({ key: "p1", recursive: false })],
    });
    const fixed = fixTool(tool);
    expect(fixed.parameters[0]).not.toHaveProperty("recursive");
  });

  it("removes an empty aliases array from parameters", () => {
    const tool = baseTool({
      parameters: [baseParam({ key: "p1", aliases: [] })],
    });
    const fixed = fixTool(tool);
    expect(fixed.parameters[0]).not.toHaveProperty("aliases");
  });

  it("removes an empty installation section", () => {
    const tool = baseTool({ installation: { sources: [] } });
    const fixed = fixTool(tool);
    expect(fixed).not.toHaveProperty("installation");
  });

  it("preserves a populated installation section", () => {
    const tool = baseTool({
      installation: {
        sources: [{ key: "brew", method: "package_manager", command: "brew install x" }],
      },
    });
    const fixed = fixTool(tool);
    expect(fixed.installation?.sources).toHaveLength(1);
  });

  it("removes default keyValueSeparator from parameters", () => {
    const tool = baseTool({
      parameters: [baseParam({ key: "p1", keyValueSeparator: " " })],
    });
    const fixed = fixTool(tool);
    expect(fixed.parameters[0]).not.toHaveProperty("keyValueSeparator");
  });

  it("preserves non-default keyValueSeparator from parameters", () => {
    const tool = baseTool({
      parameters: [baseParam({ key: "p1", keyValueSeparator: "=" })],
    });
    const fixed = fixTool(tool);
    expect(fixed.parameters[0].keyValueSeparator).toBe("=");
  });

  it("removes default arraySeparator from non-repeatable parameters", () => {
    const tool = baseTool({
      parameters: [baseParam({ key: "p1", arraySeparator: "," })],
    });
    const fixed = fixTool(tool);
    expect(fixed.parameters[0]).not.toHaveProperty("arraySeparator");
  });

  it("preserves arraySeparator for repeatable parameters", () => {
    const tool = baseTool({
      parameters: [baseParam({ key: "p1", isRepeatable: true, arraySeparator: "," })],
    });
    const fixed = fixTool(tool);
    expect(fixed.parameters[0].arraySeparator).toBe(",");
  });

  it("removes empty validations array", () => {
    const tool = baseTool({
      parameters: [baseParam({ key: "p1", validations: [] })],
    });
    const fixed = fixTool(tool);
    expect(fixed.parameters[0]).not.toHaveProperty("validations");
  });

  it("removes empty dependencies array", () => {
    const tool = baseTool({
      parameters: [baseParam({ key: "p1", dependencies: [] })],
    });
    const fixed = fixTool(tool);
    expect(fixed.parameters[0]).not.toHaveProperty("dependencies");
  });

  it("removes enum with empty values", () => {
    const tool = baseTool({
      parameters: [baseParam({ key: "p1", enum: { values: [] } })],
    });
    const fixed = fixTool(tool);
    expect(fixed.parameters[0]).not.toHaveProperty("enum");
  });

  it("preserves enum with values", () => {
    const tool = baseTool({
      parameters: [
        baseParam({
          key: "p1",
          dataType: "Enum",
          enum: { values: [{ value: "a", displayName: "A" }] },
        }),
      ],
    });
    const fixed = fixTool(tool);
    expect(fixed.parameters[0].enum?.values).toHaveLength(1);
  });

  it("removes empty exclusionGroups", () => {
    const tool = baseTool({ exclusionGroups: [] });
    const fixed = fixTool(tool);
    expect(fixed).not.toHaveProperty("exclusionGroups");
  });

  it("preserves non-empty exclusionGroups", () => {
    const tool = baseTool({
      parameters: [baseParam({ key: "p1" }), baseParam({ key: "p2" })],
      exclusionGroups: [
        { displayName: "Group", exclusionType: "mutual_exclusive", parameterKeys: ["p1", "p2"] },
      ],
    });
    const fixed = fixTool(tool);
    expect(fixed.exclusionGroups).toHaveLength(1);
  });

  it("removes empty metadata", () => {
    const tool = baseTool({ metadata: {} as Tool["metadata"] });
    const fixed = fixTool(tool);
    expect(fixed).not.toHaveProperty("metadata");
  });

  it("removes interactive: false from tool", () => {
    const tool = baseTool({ interactive: false });
    const fixed = fixTool(tool);
    expect(fixed).not.toHaveProperty("interactive");
  });

  it("removes interactive: false from commands", () => {
    const tool = baseTool({
      commands: [{ key: "run", displayName: "Run", interactive: false }],
    });
    const fixed = fixTool(tool);
    expect(fixed.commands[0]).not.toHaveProperty("interactive");
  });

  it("preserves interactive: true", () => {
    const tool = baseTool({ interactive: true });
    const fixed = fixTool(tool);
    expect(fixed.interactive).toBe(true);
  });

  it("removes empty parameter metadata", () => {
    const tool = baseTool({
      parameters: [baseParam({ key: "p1", metadata: {} })],
    });
    const fixed = fixTool(tool);
    expect(fixed.parameters[0]).not.toHaveProperty("metadata");
  });

  it("removes parameter metadata with empty tags", () => {
    const tool = baseTool({
      parameters: [baseParam({ key: "p1", metadata: { tags: [] } })],
    });
    const fixed = fixTool(tool);
    expect(fixed.parameters[0]).not.toHaveProperty("metadata");
  });

  it("adds $schema when addSchema is true", () => {
    const tool = baseTool();
    const fixed = fixTool(tool, { addSchema: true });
    expect((fixed as unknown as Record<string, unknown>)["$schema"]).toBe(SCHEMA_URL);
  });

  it("does not add $schema by default", () => {
    const tool = baseTool();
    const fixed = fixTool(tool);
    expect((fixed as unknown as Record<string, unknown>)["$schema"]).toBeUndefined();
  });

  it("removes parameter metadata when removeMetadata is true", () => {
    const tool = baseTool({
      parameters: [baseParam({ key: "p1", metadata: { tags: ["test"] } })],
    });
    const fixed = fixTool(tool, { removeMetadata: true });
    expect(fixed.parameters[0]).not.toHaveProperty("metadata");
  });

  it("does not mutate the original tool", () => {
    const tool = baseTool({
      parameters: [baseParam({ key: "p1", isRequired: false, validations: [] })],
    });
    const original = JSON.stringify(tool);
    fixTool(tool);
    expect(JSON.stringify(tool)).toBe(original);
  });
});
