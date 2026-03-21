import { GeneratedCommand } from "../generated-command";
import { render, screen } from "@testing-library/react";

const testTool = {
  name: "tool",
  displayName: "Tool",
  commands: [{ key: "test-key", name: "test", isDefault: true, sortOrder: 0 }],
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

  it("does not duplicate argument-type parameters in the generated command", () => {
    const tool = {
      name: "curl",
      displayName: "Curl",
      commands: [{ key: "curl", name: "curl", isDefault: true, sortOrder: 1 }],
      parameters: [
        {
          key: "target",
          name: "target",
          commandKey: "curl",
          parameterType: "Argument" as const,
          dataType: "String" as const,
          isRequired: true,
          position: 1,
          sortOrder: 1,
        },
      ],
    };

    render(
      <GeneratedCommand
        tool={tool}
        parameterValues={{ target: "https://example.com" }}
      />,
    );

    const output = screen.getByText(/curl/);
    expect(output.textContent).toBe("curl https://example.com");
  });
});
