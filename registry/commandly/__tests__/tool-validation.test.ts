import type { Tool, Parameter } from "@/components/commandly/types/tool";
import {
  validateTool,
  formatValidationErrors,
  hasErrors,
} from "@/components/commandly/utils/tool-validation";

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
    aliases: ["--param-1"],
    ...overrides,
  };
}

describe("validateTool", () => {
  it("returns no errors for a valid minimal tool", () => {
    const errors = validateTool(baseTool());
    expect(errors).toHaveLength(0);
  });

  it("reports missing binaryName", () => {
    const errors = validateTool(baseTool({ binaryName: "" }));
    expect(errors).toContainEqual(
      expect.objectContaining({ path: "binaryName", severity: "error" }),
    );
  });

  it("reports missing displayName", () => {
    const errors = validateTool(baseTool({ displayName: "" }));
    expect(errors).toContainEqual(
      expect.objectContaining({ path: "displayName", severity: "error" }),
    );
  });

  it("reports duplicate parameter keys", () => {
    const errors = validateTool(
      baseTool({
        parameters: [baseParam({ key: "dup" }), baseParam({ key: "dup" })],
      }),
    );
    expect(errors).toContainEqual(
      expect.objectContaining({ message: expect.stringContaining("Duplicate parameter key") }),
    );
  });

  it("reports duplicate command keys", () => {
    const errors = validateTool(
      baseTool({
        commands: [
          { key: "cmd", displayName: "Cmd" },
          { key: "cmd", displayName: "Cmd 2" },
        ],
      }),
    );
    expect(errors).toContainEqual(
      expect.objectContaining({ message: expect.stringContaining("Duplicate command key") }),
    );
  });

  it("reports a command parameter that is not attached to any command", () => {
    const errors = validateTool(
      baseTool({
        commands: [{ key: "run", displayName: "Run", parameters: [baseParam({ key: "p1" })] }],
        parameters: [],
      }),
    );
    expect(errors.filter((e) => e.severity === "error")).toHaveLength(0);
  });

  it("reports a duplicate parameter key within a command", () => {
    const errors = validateTool(
      baseTool({
        commands: [
          {
            key: "run",
            displayName: "Run",
            parameters: [baseParam({ key: "dup" }), baseParam({ key: "dup" })],
          },
        ],
      }),
    );
    expect(errors).toContainEqual(
      expect.objectContaining({
        message: expect.stringContaining('Duplicate parameter key "dup"'),
      }),
    );
  });

  it("allows the same parameter key in sibling commands", () => {
    const errors = validateTool(
      baseTool({
        commands: [
          { key: "add", displayName: "add", parameters: [baseParam({ key: "quiet" })] },
          { key: "am", displayName: "am", parameters: [baseParam({ key: "quiet" })] },
        ],
      }),
    );
    expect(errors.filter((e) => e.severity === "error")).toHaveLength(0);
  });

  it("does not require aliases on a parameter", () => {
    const errors = validateTool(
      baseTool({
        commands: [],
        parameters: [baseParam({ key: "p1", aliases: [] })],
      }),
    );
    expect(errors.filter((e) => e.severity === "error")).toHaveLength(0);
  });

  it("does not require aliases for positional arguments", () => {
    const errors = validateTool(
      baseTool({
        commands: [],
        parameters: [
          baseParam({
            key: "p1",
            parameterType: "Argument",
            dataType: "String",
            aliases: undefined,
          }),
        ],
      }),
    );
    expect(errors.filter((e) => e.severity === "error")).toHaveLength(0);
  });

  it("reports a dependency referencing a parameter outside the command", () => {
    const errors = validateTool(
      baseTool({
        commands: [
          {
            key: "run",
            displayName: "Run",
            parameters: [
              baseParam({
                key: "p1",
                dependencies: [
                  {
                    key: "d1",
                    parameterKey: "p1",
                    dependsOnParameterKey: "missing",
                    dependencyType: "requires",
                  },
                ],
              }),
            ],
          },
        ],
      }),
    );
    expect(errors).toContainEqual(
      expect.objectContaining({
        message: expect.stringContaining('non-existent parameter "missing"'),
      }),
    );
  });

  it("warns when flag has non-Boolean dataType", () => {
    const errors = validateTool(
      baseTool({
        parameters: [baseParam({ key: "f1", parameterType: "Flag", dataType: "String" })],
      }),
    );
    expect(errors).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        message: expect.stringContaining('should have dataType "Boolean"'),
      }),
    );
  });

  it("reports enum parameter with no enum values", () => {
    const errors = validateTool(
      baseTool({
        parameters: [baseParam({ key: "e1", dataType: "Enum" })],
      }),
    );
    expect(errors).toContainEqual(
      expect.objectContaining({
        message: expect.stringContaining("no enum values"),
      }),
    );
  });

  it("reports enum value missing displayName", () => {
    const errors = validateTool(
      baseTool({
        parameters: [
          baseParam({
            key: "e1",
            dataType: "Enum",
            enum: {
              values: [{ value: "a", displayName: "" }],
            },
          }),
        ],
      }),
    );
    expect(errors).toContainEqual(
      expect.objectContaining({
        message: expect.stringContaining("no displayName"),
      }),
    );
  });

  it("reports dependency referencing non-existent parameter", () => {
    const errors = validateTool(
      baseTool({
        parameters: [
          baseParam({
            key: "p1",
            dependencies: [
              {
                key: "d1",
                parameterKey: "p1",
                dependsOnParameterKey: "missing",
                dependencyType: "requires",
              },
            ],
          }),
        ],
      }),
    );
    expect(errors).toContainEqual(
      expect.objectContaining({
        message: expect.stringContaining('non-existent parameter "missing"'),
      }),
    );
  });

  it("reports exclusion group referencing non-existent parameter", () => {
    const errors = validateTool(
      baseTool({
        parameters: [baseParam({ key: "p1" }), baseParam({ key: "p2" })],
        exclusionGroups: [
          {
            displayName: "Group",
            exclusionType: "mutual_exclusive",
            parameterKeys: ["p1", "missing"],
          },
        ],
      }),
    );
    expect(errors).toContainEqual(
      expect.objectContaining({
        message: expect.stringContaining('non-existent parameter "missing"'),
      }),
    );
  });

  it("reports exclusion group with fewer than 2 parameters", () => {
    const errors = validateTool(
      baseTool({
        parameters: [baseParam({ key: "p1" })],
        exclusionGroups: [
          {
            displayName: "Group",
            exclusionType: "mutual_exclusive",
            parameterKeys: ["p1"],
          },
        ],
      }),
    );
    expect(errors).toContainEqual(
      expect.objectContaining({
        message: expect.stringContaining("at least 2 parameters"),
      }),
    );
  });

  it("reports duplicate command keys across the nested tree", () => {
    const errors = validateTool(
      baseTool({
        commands: [
          { key: "config", displayName: "Config", commands: [{ key: "get", displayName: "Get" }] },
          { key: "get", displayName: "Other Get" },
        ],
      }),
    );
    expect(errors).toContainEqual(
      expect.objectContaining({
        message: expect.stringContaining('Duplicate command key "get"'),
      }),
    );
  });

  it("validates parameters declared on nested commands", () => {
    const errors = validateTool(
      baseTool({
        commands: [
          {
            key: "config",
            displayName: "Config",
            commands: [{ key: "get", displayName: "Get", parameters: [baseParam({ key: "" })] }],
          },
        ],
      }),
    );
    expect(errors).toContainEqual(
      expect.objectContaining({
        path: "commands[0].commands[0].parameters[0].key",
      }),
    );
  });

  it("accepts a valid tool with commands and parameters", () => {
    const errors = validateTool(
      baseTool({
        commands: [
          { key: "run", displayName: "Run", parameters: [baseParam({ key: "target" })] },
          {
            key: "start",
            displayName: "start",
            parameters: [
              baseParam({
                key: "verbose",
                recursive: true,
                parameterType: "Flag",
                dataType: "Boolean",
              }),
            ],
          },
        ],
        parameters: [
          baseParam({ key: "help", recursive: true, parameterType: "Flag", dataType: "Boolean" }),
        ],
      }),
    );
    const realErrors = errors.filter((e) => e.severity === "error");
    expect(realErrors).toHaveLength(0);
  });
});

describe("formatValidationErrors", () => {
  it("returns empty string for no errors", () => {
    expect(formatValidationErrors([])).toBe("");
  });

  it("formats errors with severity icons", () => {
    const result = formatValidationErrors([
      { path: "test", message: "broken", severity: "error" },
      { path: "test2", message: "warning", severity: "warning" },
    ]);
    expect(result).toContain("❌");
    expect(result).toContain("⚠️");
  });
});

describe("hasErrors", () => {
  it("returns false for empty array", () => {
    expect(hasErrors([])).toBe(false);
  });

  it("returns false for warnings only", () => {
    expect(hasErrors([{ path: "x", message: "warn", severity: "warning" }])).toBe(false);
  });

  it("returns true when errors present", () => {
    expect(hasErrors([{ path: "x", message: "err", severity: "error" }])).toBe(true);
  });
});
