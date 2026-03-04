import { JsonOutput } from "../json-output";
import { defaultTool, exportToStructuredJSON } from "@/registry/commandly/lib/utils/commandly";
import { convertToNestedStructure } from "@/registry/commandly/lib/utils/commandly-nested";
import { render, screen } from "@testing-library/react";
import { OnUrlUpdateFunction, withNuqsTestingAdapter } from "nuqs/adapters/testing";
import type { Tool } from "@/registry/commandly/lib/types/commandly";

const toJSON = (value: unknown) => JSON.parse(JSON.stringify(value));

describe("JsonOutput", () => {
  it("renders output type label", () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();

    render(<JsonOutput tool={defaultTool()} />, {
      wrapper: withNuqsTestingAdapter({
        searchParams: "?newTool=newTool",
        onUrlUpdate,
      }),
    });
    expect(screen.getByText(/Output type/)).toBeInTheDocument();
  });
});

describe("exportToStructuredJSON", () => {
  it("omits enumValues, validations, dependencies when empty", () => {
    const result = toJSON(exportToStructuredJSON(defaultTool()));
    result.parameters.forEach((param: Record<string, unknown>) => {
      expect(param).not.toHaveProperty("enumValues");
      expect(param).not.toHaveProperty("validations");
      expect(param).not.toHaveProperty("dependencies");
    });
  });

  it("omits exclusionGroups when empty", () => {
    const result = toJSON(exportToStructuredJSON(defaultTool()));
    expect(result).not.toHaveProperty("exclusionGroups");
  });

  it("includes enumValues when non-empty", () => {
    const tool = defaultTool();
    tool.parameters[0].enumValues = [
      { key: "ev1", parameterKey: "--help", value: "val", displayName: "Val", description: "", isDefault: true, sortOrder: 0 },
    ];
    const result = exportToStructuredJSON(tool);
    expect(result.parameters[0].enumValues).toHaveLength(1);
  });

  it("includes validations when non-empty", () => {
    const tool = defaultTool();
    tool.parameters[0].validations = [
      { key: "v1", parameterKey: "--help", validationType: "min_length", validationValue: "3", errorMessage: "Too short" },
    ];
    const result = exportToStructuredJSON(tool);
    expect(result.parameters[0].validations).toHaveLength(1);
  });

  it("includes exclusionGroups when non-empty", () => {
    const tool = defaultTool();
    tool.exclusionGroups = [
      { key: "eg1", name: "Group 1", exclusionType: "required_one_of", parameterKeys: ["--help"] },
    ];
    const result = exportToStructuredJSON(tool);
    expect(result.exclusionGroups).toHaveLength(1);
  });
});

describe("convertToNestedStructure", () => {
  it("omits validations and dependencies when empty", () => {
    const result = toJSON(convertToNestedStructure(defaultTool()));
    result.globalParameters.forEach((param: Record<string, unknown>) => {
      expect(param).not.toHaveProperty("validations");
      expect(param).not.toHaveProperty("dependencies");
    });
  });

  it("omits exclusionGroups when empty", () => {
    const result = toJSON(convertToNestedStructure(defaultTool()));
    expect(result).not.toHaveProperty("exclusionGroups");
  });

  it("includes validations when non-empty", () => {
    const tool = defaultTool();
    tool.parameters[0].validations = [
      { key: "v1", parameterKey: "--help", validationType: "min_length", validationValue: "3", errorMessage: "Too short" },
    ];
    const result = convertToNestedStructure(tool);
    expect((result.globalParameters[0] as Record<string, unknown>).validations).toHaveLength(1);
  });

  it("includes exclusionGroups when non-empty", () => {
    const tool: Tool = {
      ...defaultTool(),
      exclusionGroups: [
        { key: "eg1", name: "Group 1", exclusionType: "mutual_exclusive", parameterKeys: ["--help"] },
      ],
    };
    const result = convertToNestedStructure(tool);
    expect(result.exclusionGroups).toHaveLength(1);
    expect(result.exclusionGroups![0].parameters).toContain("--help");
  });
});
