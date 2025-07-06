import { render, screen } from "@testing-library/react";
import { RuntimePreview } from "../../core-components/runtime-preview";
import { defaultTool } from "@/registry/commandly/lib/utils/tool-editor";

describe("RuntimePreview", () => {
  it("renders no parameters message if none", () => {
    render(
      <RuntimePreview
        tool={{ ...defaultTool(), name: "tool", commands: [], parameters: [] }}
        parameterValues={{}}
        updateParameterValue={() => {}}
      />
    );
    expect(screen.getByText(/No parameters available/)).toBeInTheDocument();
  });
});
