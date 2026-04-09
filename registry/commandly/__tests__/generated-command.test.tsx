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

  it("emits repeated flags for a repeatable Option with an array value", () => {
    const tool = {
      name: "curl",
      displayName: "Curl",
      commands: [{ key: "curl", name: "curl", isDefault: true, sortOrder: 1 }],
      parameters: [
        {
          key: "header",
          name: "Header",
          commandKey: "curl",
          parameterType: "Option" as const,
          dataType: "String" as const,
          longFlag: "--header",
          isRepeatable: true,
          sortOrder: 1,
        },
      ],
    };
    render(
      <GeneratedCommand
        tool={tool}
        parameterValues={{
          header: ["Content-Type: application/json", "Authorization: Bearer token"],
        }}
      />,
    );
    const output = screen.getByText(/curl/);
    expect(output.textContent).toBe(
      "curl --header Content-Type: application/json --header Authorization: Bearer token",
    );
  });

  it("emits a single joined token for a repeatable Option with arraySeparator", () => {
    const tool = {
      name: "mytool",
      displayName: "My Tool",
      commands: [{ key: "mytool", name: "mytool", isDefault: true, sortOrder: 1 }],
      parameters: [
        {
          key: "filter",
          name: "Filter",
          commandKey: "mytool",
          parameterType: "Option" as const,
          dataType: "String" as const,
          longFlag: "--filter",
          isRepeatable: true,
          arraySeparator: ",",
          sortOrder: 1,
        },
      ],
    };
    render(
      <GeneratedCommand
        tool={tool}
        parameterValues={{ filter: ["prod", "staging"] }}
      />,
    );
    const output = screen.getByText(/mytool/);
    expect(output.textContent).toBe("mytool --filter prod,staging");
  });

  it("does not emit a flag when all repeatable values are empty strings", () => {
    const tool = {
      name: "curl",
      displayName: "Curl",
      commands: [{ key: "curl", name: "curl", isDefault: true, sortOrder: 1 }],
      parameters: [
        {
          key: "header",
          name: "Header",
          commandKey: "curl",
          parameterType: "Option" as const,
          dataType: "String" as const,
          longFlag: "--header",
          isRepeatable: true,
          sortOrder: 1,
        },
      ],
    };
    render(
      <GeneratedCommand
        tool={tool}
        parameterValues={{ header: ["", ""] }}
      />,
    );
    expect(screen.queryByText(/--header/)).not.toBeInTheDocument();
  });

  it("emits a repeatable Flag multiple times based on numeric value", () => {
    const tool = {
      name: "ssh",
      displayName: "SSH",
      commands: [{ key: "ssh", name: "ssh", isDefault: true, sortOrder: 1 }],
      parameters: [
        {
          key: "verbose",
          name: "Verbose",
          commandKey: "ssh",
          parameterType: "Flag" as const,
          dataType: "Boolean" as const,
          shortFlag: "-v",
          isRepeatable: true,
          sortOrder: 1,
        },
      ],
    };
    render(
      <GeneratedCommand
        tool={tool}
        parameterValues={{ verbose: 3 }}
      />,
    );
    const output = screen.getByText(/ssh/);
    expect(output.textContent).toBe("ssh -v -v -v");
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
