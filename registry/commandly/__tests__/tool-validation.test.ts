import type { Tool, Parameter } from "@/components/commandly/types/flat";
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
    name: "Param 1",
    parameterType: "Option",
    dataType: "String",
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
          { key: "cmd", name: "Cmd" },
          { key: "cmd", name: "Cmd 2" },
        ],
      }),
    );
    expect(errors).toContainEqual(
      expect.objectContaining({ message: expect.stringContaining("Duplicate command key") }),
    );
  });

  it("reports parameter missing commandKey when commands exist", () => {
    const errors = validateTool(
      baseTool({
        commands: [{ key: "run", name: "Run" }],
        parameters: [baseParam({ key: "p1" })],
      }),
    );
    expect(errors).toContainEqual(
      expect.objectContaining({
        message: expect.stringContaining("must have commandKey or isGlobal"),
      }),
    );
  });

  it("reports parameter with commandKey when no commands exist", () => {
    const errors = validateTool(
      baseTool({
        commands: [],
        parameters: [baseParam({ key: "p1", commandKey: "run" })],
      }),
    );
    expect(errors).toContainEqual(
      expect.objectContaining({
        message: expect.stringContaining("must not have commandKey or isGlobal"),
      }),
    );
  });

  it("reports parameter with both isGlobal and commandKey", () => {
    const errors = validateTool(
      baseTool({
        commands: [{ key: "run", name: "Run" }],
        parameters: [baseParam({ key: "p1", isGlobal: true, commandKey: "run" })],
      }),
    );
    expect(errors).toContainEqual(
      expect.objectContaining({
        message: expect.stringContaining("both isGlobal and commandKey"),
      }),
    );
  });

  it("reports parameter referencing non-existent command", () => {
    const errors = validateTool(
      baseTool({
        commands: [{ key: "run", name: "Run" }],
        parameters: [baseParam({ key: "p1", commandKey: "missing" })],
      }),
    );
    expect(errors).toContainEqual(
      expect.objectContaining({
        message: expect.stringContaining('non-existent command "missing"'),
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
            name: "Group",
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
            name: "Group",
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

  it("reports command referencing non-existent parent", () => {
    const errors = validateTool(
      baseTool({
        commands: [{ key: "sub", name: "Sub", parentCommandKey: "missing" }],
      }),
    );
    expect(errors).toContainEqual(
      expect.objectContaining({
        message: expect.stringContaining('non-existent parent command "missing"'),
      }),
    );
  });

  it("accepts valid tool with commands and global/command parameters", () => {
    const errors = validateTool(
      baseTool({
        commands: [{ key: "run", name: "Run" }],
        parameters: [
          baseParam({ key: "verbose", isGlobal: true, parameterType: "Flag", dataType: "Boolean" }),
          baseParam({ key: "target", commandKey: "run" }),
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
