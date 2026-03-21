import { JsonOutput } from "../json-output";
import type { Tool } from "@/components/commandly/types/flat";
import { exportToStructuredJSON } from "@/components/commandly/utils/flat";
import { convertToNestedStructure } from "@/components/commandly/utils/nested";
import { defaultTool } from "@/lib/utils";
import { render, screen } from "@testing-library/react";
import { OnUrlUpdateFunction, withNuqsTestingAdapter } from "nuqs/adapters/testing";

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
  it("omits enum, validations, dependencies when empty", () => {
    const result = toJSON(exportToStructuredJSON(defaultTool()));
    result.parameters.forEach((param: Record<string, unknown>) => {
      expect(param).not.toHaveProperty("enum");
      expect(param).not.toHaveProperty("validations");
      expect(param).not.toHaveProperty("dependencies");
    });
  });

  it("omits exclusionGroups when empty", () => {
    const result = toJSON(exportToStructuredJSON(defaultTool()));
    expect(result).not.toHaveProperty("exclusionGroups");
  });

  it("includes enum when non-empty", () => {
    const tool = defaultTool();
    tool.parameters[0].enum = {
      values: [
        {
          value: "val",
          displayName: "Val",
          description: "",
          isDefault: true,
          sortOrder: 0,
        },
      ],
      allowMultiple: false,
    };
    const result = exportToStructuredJSON(tool);
    expect(result.parameters[0].enum?.values).toHaveLength(1);
  });

  it("includes validations when non-empty", () => {
    const tool = defaultTool();
    tool.parameters[0].validations = [
      {
        key: "v1",
        validationType: "min_length",
        validationValue: "3",
        errorMessage: "Too short",
      },
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
      {
        key: "v1",
        validationType: "min_length",
        validationValue: "3",
        errorMessage: "Too short",
      },
    ];
    const result = convertToNestedStructure(tool);
    expect(
      (result.globalParameters[0] as unknown as Record<string, unknown>).validations,
    ).toHaveLength(1);
  });

  it("includes exclusionGroups when non-empty", () => {
    const tool: Tool = {
      ...defaultTool(),
      exclusionGroups: [
        {
          key: "eg1",
          name: "Group 1",
          exclusionType: "mutual_exclusive",
          parameterKeys: ["--help"],
        },
      ],
    };
    const result = convertToNestedStructure(tool);
    expect(result.exclusionGroups).toHaveLength(1);
    expect(result.exclusionGroups![0].parameters).toContain("--help");
  });
});
