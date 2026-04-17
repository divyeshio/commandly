import { SCHEMA_URL } from "@/components/ai-chat/tool-rules";
import type { Tool, Parameter } from "@/components/commandly/types/flat";
import { fixTool } from "@/components/commandly/utils/flat";

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
    name: "Param 1",
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

  it("removes isGlobal: false from parameters", () => {
    const tool = baseTool({
      parameters: [baseParam({ key: "p1", isGlobal: false })],
    });
    const fixed = fixTool(tool);
    expect(fixed.parameters[0]).not.toHaveProperty("isGlobal");
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
        { name: "Group", exclusionType: "mutual_exclusive", parameterKeys: ["p1", "p2"] },
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
      commands: [{ key: "run", name: "Run", interactive: false }],
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

  it("moves top-level description into info object", () => {
    const tool = { ...baseTool(), description: "A test tool" } as Tool & { description?: string };
    const fixed = fixTool(tool as Tool);
    expect(fixed.info?.description).toBe("A test tool");
    expect((fixed as unknown as Record<string, unknown>)["description"]).toBeUndefined();
  });

  it("moves top-level version into info object", () => {
    const tool = { ...baseTool(), version: "1.0.0" } as Tool & { version?: string };
    const fixed = fixTool(tool as Tool);
    expect(fixed.info?.version).toBe("1.0.0");
    expect((fixed as unknown as Record<string, unknown>)["version"]).toBeUndefined();
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
