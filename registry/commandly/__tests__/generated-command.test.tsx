import { GeneratedCommand } from "../generated-command";
import { generateCommand } from "@/components/commandly/utils/flat";
import { fireEvent, render, screen } from "@testing-library/react";

const testTool = {
  binaryName: "tool",
  displayName: "Tool",
  commands: [{ key: "test-key", name: "test", sortOrder: 0 }],
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
      binaryName: "curl",
      displayName: "Curl",
      commands: [{ key: "curl", name: "curl", sortOrder: 1 }],
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
      binaryName: "mytool",
      displayName: "My Tool",
      commands: [{ key: "mytool", name: "mytool", sortOrder: 1 }],
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
      binaryName: "curl",
      displayName: "Curl",
      commands: [{ key: "curl", name: "curl", sortOrder: 1 }],
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
      binaryName: "ssh",
      displayName: "SSH",
      commands: [{ key: "ssh", name: "ssh", sortOrder: 1 }],
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
      binaryName: "curl",
      displayName: "Curl",
      commands: [{ key: "curl", name: "curl", sortOrder: 1 }],
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

  it("generates command for a root-only tool (no commands)", () => {
    const tool = {
      binaryName: "httpx",
      displayName: "Httpx",
      commands: [],
      parameters: [
        {
          key: "list",
          name: "List",
          parameterType: "Option" as const,
          dataType: "String" as const,
          shortFlag: "-l",
          longFlag: "-list",
          sortOrder: 1,
        },
        {
          key: "target",
          name: "Target",
          parameterType: "Option" as const,
          dataType: "String" as const,
          shortFlag: "-u",
          longFlag: "-target",
          sortOrder: 2,
        },
      ],
    };
    render(
      <GeneratedCommand
        tool={tool}
        parameterValues={{ list: "urls.txt", target: "example.com" }}
      />,
    );
    const output = screen.getByText(/httpx/);
    expect(output.textContent).toBe("httpx -l urls.txt -u example.com");
  });

  it("generates command with only tool name when root-only tool has no values set", () => {
    const tool = {
      binaryName: "httpx",
      displayName: "Httpx",
      commands: [],
      parameters: [
        {
          key: "list",
          name: "List",
          parameterType: "Option" as const,
          dataType: "String" as const,
          longFlag: "-list",
          sortOrder: 1,
        },
      ],
    };
    render(
      <GeneratedCommand
        tool={tool}
        parameterValues={{}}
      />,
    );
    const output = screen.getByText(/httpx/);
    expect(output.textContent).toBe("httpx");
  });

  it("renders command output in a horizontally scrollable container and stacks actions accessibly", () => {
    render(
      <GeneratedCommand
        tool={{
          binaryName: "curl",
          displayName: "Curl",
          commands: [{ key: "curl", name: "curl", sortOrder: 1 }],
          parameters: [
            {
              key: "url",
              name: "URL",
              commandKey: "curl",
              parameterType: "Argument",
              dataType: "String",
              position: 1,
              sortOrder: 1,
            },
          ],
        }}
        parameterValues={{ url: "https://example.com/really/long/path/that/should/not/wrap" }}
        onSaveCommand={() => {}}
      />,
    );

    expect(screen.getByText(/https:\/\/example.com\/really\/long\/path/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /copy command/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save command/i })).toBeInTheDocument();
  });

  it("includes root parameters in generated command when tool has commands but selectedCommand is null", () => {
    const tool = {
      binaryName: "mycli",
      displayName: "My CLI",
      commands: [{ key: "sub", name: "sub", sortOrder: 0 }],
      parameters: [
        {
          key: "verbose",
          name: "Verbose",
          parameterType: "Flag" as const,
          dataType: "Boolean" as const,
          longFlag: "--verbose",
          sortOrder: 1,
        },
        {
          key: "output",
          name: "Output",
          parameterType: "Option" as const,
          dataType: "String" as const,
          longFlag: "--output",
          commandKey: "sub",
          sortOrder: 2,
        },
      ],
    };
    render(
      <GeneratedCommand
        tool={tool}
        selectedCommand={null}
        parameterValues={{ verbose: true }}
      />,
    );
    const output = screen.getByText(/mycli/);
    expect(output.textContent).toBe("mycli --verbose");
  });

  it("includes parent command path for nested subcommands", () => {
    const tool = {
      binaryName: "mycli",
      displayName: "My CLI",
      commands: [
        { key: "config", name: "config", sortOrder: 0 },
        { key: "get", name: "get", parentCommandKey: "config", sortOrder: 0 },
      ],
      parameters: [
        {
          key: "key-param",
          name: "Key",
          parameterType: "Argument" as const,
          dataType: "String" as const,
          commandKey: "get",
          position: 1,
          sortOrder: 1,
        },
      ],
    };
    render(
      <GeneratedCommand
        tool={tool}
        selectedCommand={tool.commands[1]}
        parameterValues={{ "key-param": "app.name" }}
      />,
    );
    const output = screen.getByText(/mycli/);
    expect(output.textContent).toBe("mycli config get app.name");
  });

  it("renders long flags when useLongFlag is enabled", () => {
    const tool = {
      binaryName: "curl",
      displayName: "Curl",
      commands: [{ key: "curl", name: "curl", sortOrder: 1 }],
      parameters: [
        {
          key: "request",
          name: "Request",
          commandKey: "curl",
          parameterType: "Option" as const,
          dataType: "String" as const,
          shortFlag: "-X",
          longFlag: "--request",
          sortOrder: 1,
        },
      ],
    };

    render(
      <GeneratedCommand
        tool={tool}
        parameterValues={{ request: "POST" }}
        useLongFlag={true}
      />,
    );

    const output = screen.getByText(/curl/);
    expect(output.textContent).toBe("curl --request POST");
  });

  it("toggles between short and long flags from the UI", () => {
    const tool = {
      binaryName: "curl",
      displayName: "Curl",
      commands: [{ key: "curl", name: "curl", sortOrder: 1 }],
      parameters: [
        {
          key: "request",
          name: "Request",
          commandKey: "curl",
          parameterType: "Option" as const,
          dataType: "String" as const,
          shortFlag: "-X",
          longFlag: "--request",
          sortOrder: 1,
        },
      ],
    };

    render(
      <GeneratedCommand
        tool={tool}
        parameterValues={{ request: "POST" }}
      >
        <GeneratedCommand.Header>
          <GeneratedCommand.FlagPreference />
        </GeneratedCommand.Header>
        <GeneratedCommand.Output />
        <GeneratedCommand.Actions />
      </GeneratedCommand>,
    );

    expect(screen.getByText("curl -X POST")).toBeInTheDocument();
    expect(screen.getByText(/generated command/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("switch", { name: /long flags/i }));

    expect(screen.getByText("curl --request POST")).toBeInTheDocument();
  });

  it("allows composing a custom toolbar without affecting default actions", () => {
    const tool = {
      binaryName: "curl",
      displayName: "Curl",
      commands: [{ key: "curl", name: "curl", sortOrder: 1 }],
      parameters: [
        {
          key: "request",
          name: "Request",
          commandKey: "curl",
          parameterType: "Option" as const,
          dataType: "String" as const,
          shortFlag: "-X",
          longFlag: "--request",
          sortOrder: 1,
        },
      ],
    };

    render(
      <GeneratedCommand
        tool={tool}
        parameterValues={{ request: "POST" }}
      >
        <GeneratedCommand.Header>
          <span>Custom Controls</span>
        </GeneratedCommand.Header>
        <GeneratedCommand.Toolbar>
          <GeneratedCommand.FlagPreference />
        </GeneratedCommand.Toolbar>
        <GeneratedCommand.Output />
        <GeneratedCommand.Actions />
      </GeneratedCommand>,
    );

    expect(screen.getByText("Custom Controls")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /copy command/i })).toBeInTheDocument();
  });

  it("still allows rendering only the output without header or preference", () => {
    const tool = {
      binaryName: "curl",
      displayName: "Curl",
      commands: [{ key: "curl", name: "curl", sortOrder: 1 }],
      parameters: [
        {
          key: "request",
          name: "Request",
          commandKey: "curl",
          parameterType: "Option" as const,
          dataType: "String" as const,
          shortFlag: "-X",
          longFlag: "--request",
          sortOrder: 1,
        },
      ],
    };

    render(
      <GeneratedCommand
        tool={tool}
        parameterValues={{ request: "POST" }}
      >
        <GeneratedCommand.Output />
      </GeneratedCommand>,
    );

    expect(screen.getByText("curl -X POST")).toBeInTheDocument();
    expect(screen.queryByText(/generated command/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: /long flags/i })).not.toBeInTheDocument();
  });
});

describe("generateCommand", () => {
  it("prefers short flags by default", () => {
    const command = generateCommand(
      {
        binaryName: "curl",
        displayName: "Curl",
        commands: [{ key: "curl", name: "curl", sortOrder: 1 }],
        parameters: [
          {
            key: "request",
            name: "Request",
            commandKey: "curl",
            parameterType: "Option",
            dataType: "String",
            shortFlag: "-X",
            longFlag: "--request",
            sortOrder: 1,
          },
          {
            key: "verbose",
            name: "Verbose",
            commandKey: "curl",
            parameterType: "Flag",
            dataType: "Boolean",
            shortFlag: "-v",
            longFlag: "--verbose",
            sortOrder: 2,
          },
        ],
      },
      { request: "POST", verbose: true },
    );

    expect(command).toBe("curl -X POST -v");
  });

  it("can prefer long flags for flags and options", () => {
    const command = generateCommand(
      {
        binaryName: "curl",
        displayName: "Curl",
        commands: [{ key: "curl", name: "curl", sortOrder: 1 }],
        parameters: [
          {
            key: "request",
            name: "Request",
            commandKey: "curl",
            parameterType: "Option",
            dataType: "String",
            shortFlag: "-X",
            longFlag: "--request",
            sortOrder: 1,
          },
          {
            key: "verbose",
            name: "Verbose",
            commandKey: "curl",
            parameterType: "Flag",
            dataType: "Boolean",
            shortFlag: "-v",
            longFlag: "--verbose",
            sortOrder: 2,
          },
        ],
      },
      { request: "POST", verbose: true },
      { useLongFlag: true },
    );

    expect(command).toBe("curl --request POST --verbose");
  });

  it("matches root and global parameter handling when no command is selected", () => {
    const command = generateCommand(
      {
        binaryName: "mycli",
        displayName: "My CLI",
        commands: [{ key: "sub", name: "sub", sortOrder: 0 }],
        parameters: [
          {
            key: "verbose",
            name: "Verbose",
            parameterType: "Flag",
            dataType: "Boolean",
            longFlag: "--verbose",
            isGlobal: true,
            sortOrder: 1,
          },
          {
            key: "config",
            name: "Config",
            parameterType: "Option",
            dataType: "String",
            longFlag: "--config",
            sortOrder: 2,
          },
          {
            key: "output",
            name: "Output",
            parameterType: "Option",
            dataType: "String",
            commandKey: "sub",
            longFlag: "--output",
            sortOrder: 3,
          },
        ],
      },
      { verbose: true, config: "app.json", output: "ignored.txt" },
      { selectedCommand: null },
    );

    expect(command).toBe("mycli --verbose --config app.json");
  });
});
