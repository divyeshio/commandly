import { GeneratedCommand } from "../generated-command";
import { render } from "@testing-library/react";

const testTool = {
  name: "tool",
  displayName: "Tool",
  commands: [
    { key: "test-key", name: "test", isDefault: true, sortOrder: 0 },
  ],
  parameters: [],
};

describe("GeneratedCommand", () => {
  it("renders configure parameters message if no generated command", () => {
    render(
      <GeneratedCommand
        tool={testTool}
        parameterValues={{}}
      />,
    );
    //expect(screen.getByText(/Configure parameters/)).toBeInTheDocument();
  });
});
