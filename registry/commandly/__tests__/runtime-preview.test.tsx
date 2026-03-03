import { RuntimePreview } from "../runtime-preview";
import { defaultTool } from "@/registry/commandly/lib/utils/commandly";
import { render, screen } from "@testing-library/react";

describe("RuntimePreview", () => {
  it("renders no parameters message if none", () => {
    render(
      <RuntimePreview
        tool={{ ...defaultTool(), name: "tool", commands: [], parameters: [] }}
        parameterValues={{}}
        updateParameterValue={() => {}}
      />,
    );
    expect(screen.getByText(/No parameters available/)).toBeInTheDocument();
  });
});
