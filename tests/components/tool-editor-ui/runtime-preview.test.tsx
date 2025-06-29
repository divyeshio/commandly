import { render, screen } from "@testing-library/react";
import { RuntimePreview } from "../../../src/tools/components/tool-editor-ui/runtime-preview";

describe("RuntimePreview", () => {
  it("renders no parameters message if none", () => {
    render(
      <RuntimePreview
        tool={{ name: "tool", commands: [], parameters: [] }}
        globalParameters={[]}
        currentParameters={[]}
      />
    );
    expect(screen.getByText(/No parameters available/)).toBeInTheDocument();
  });
});
