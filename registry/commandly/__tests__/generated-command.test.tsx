import { GeneratedCommand } from "../generated-command";
import { generateCommand } from "@/components/commandly/utils/generate-command";
import { getAllCommands, resolveApplicableParameters } from "@/components/commandly/utils/tool";
import { render, screen } from "@testing-library/react";

const testTool = {
  binaryName: "tool",
  displayName: "Tool",
  commands: [{ key: "test-key", displayName: "test", sortOrder: 0 }],
  parameters: [],
};

describe("GeneratedCommand", () => {
  it("renders the generated command for the default command when no values are set", () => {
    render(
      <GeneratedCommand
        tool={testTool}
        parameterValues={{}}
      />,
    );

    expect(screen.getByText("tool test")).toBeInTheDocument();
  });

  it("emits only the first provided member of a mutual exclusion group", () => {
    const tool = {
      binaryName: "cdncheck",
      displayName: "CDNCheck",
      commands: [],
      parameters: [
        {
          key: "-cdn",
          displayName: "CDN",
          parameterType: "Flag" as const,
          dataType: "Boolean" as const,
          sortOrder: 1,
        },
        {
          key: "-cloud",
          displayName: "Cloud",
          parameterType: "Flag" as const,
          dataType: "Boolean" as const,
          sortOrder: 2,
        },
      ],
      exclusionGroups: [
        {
          key: "detection",
          displayName: "Detection",
          exclusionType: "mutual_exclusive" as const,
          parameterKeys: ["-cdn", "-cloud"],
        },
      ],
    };

    render(
      <GeneratedCommand
        tool={tool}
        parameterValues={{ "-cdn": true, "-cloud": true }}
      />,
    );

    expect(screen.getByText(/cdncheck/).textContent).toBe("cdncheck -cdn");
  });

  it("renders the empty state when the tool generates no command", () => {
    render(
      <GeneratedCommand
        tool={{ binaryName: "", displayName: "", commands: [], parameters: [] }}
        parameterValues={{}}
      />,
    );

    expect(screen.getByText(/Configure parameters/)).toBeInTheDocument();
  });

  it("emits repeated flags for a repeatable Option with an array value", () => {
    const tool = {
      binaryName: "curl",
      displayName: "Curl",
      commands: [
        {
          key: "--curl",
          displayName: "curl",
          sortOrder: 1,
          parameters: [
            {
              key: "--header",
              displayName: "Header",
              parameterType: "Option" as const,
              dataType: "String" as const,
              aliases: ["--header"],
              isRepeatable: true,
              sortOrder: 1,
            },
          ],
        },
      ],
      parameters: [],
    };
    render(
      <GeneratedCommand
        tool={tool}
        parameterValues={{
          "--header": ["Content-Type: application/json", "Authorization: Bearer token"],
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
      commands: [],
      parameters: [
        {
          key: "--filter",
          displayName: "Filter",
          parameterType: "Option" as const,
          dataType: "String" as const,
          aliases: ["--filter"],
          isRepeatable: true,
          arraySeparator: ",",
          sortOrder: 1,
        },
      ],
    };
    render(
      <GeneratedCommand
        tool={tool}
        parameterValues={{ "--filter": ["prod", "staging"] }}
      />,
    );
    const output = screen.getByText(/mytool/);
    expect(output.textContent).toBe("mytool --filter prod,staging");
  });

  it("does not emit a flag when all repeatable values are empty strings", () => {
    const tool = {
      binaryName: "curl",
      displayName: "Curl",
      commands: [
        {
          key: "--curl",
          displayName: "curl",
          sortOrder: 1,
          parameters: [
            {
              key: "--header",
              displayName: "Header",
              parameterType: "Option" as const,
              dataType: "String" as const,
              aliases: ["--header"],
              isRepeatable: true,
              sortOrder: 1,
            },
          ],
        },
      ],
      parameters: [],
    };
    render(
      <GeneratedCommand
        tool={tool}
        parameterValues={{ "--header": ["", ""] }}
      />,
    );
    expect(screen.queryByText(/--header/)).not.toBeInTheDocument();
  });

  it("emits a repeatable Flag multiple times based on numeric value", () => {
    const tool = {
      binaryName: "ssh",
      displayName: "SSH",
      commands: [],
      parameters: [
        {
          key: "--verbose",
          displayName: "Verbose",
          parameterType: "Flag" as const,
          dataType: "Boolean" as const,
          aliases: ["-v"],
          isRepeatable: true,
          sortOrder: 1,
        },
      ],
    };
    render(
      <GeneratedCommand
        tool={tool}
        parameterValues={{ "--verbose": 3 }}
      />,
    );
    const output = screen.getByText(/ssh/);
    expect(output.textContent).toBe("ssh --verbose --verbose --verbose");
  });

  it("does not duplicate argument-type parameters in the generated command", () => {
    const tool = {
      binaryName: "curl",
      displayName: "Curl",
      commands: [],
      parameters: [
        {
          key: "--target",
          displayName: "target",
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
        parameterValues={{ "--target": "https://example.com" }}
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
          key: "-list",
          displayName: "List",
          parameterType: "Option" as const,
          dataType: "String" as const,
          aliases: ["-l"],
          sortOrder: 1,
        },
        {
          key: "-target",
          displayName: "Target",
          parameterType: "Option" as const,
          dataType: "String" as const,
          aliases: ["-u"],
          sortOrder: 2,
        },
      ],
    };
    render(
      <GeneratedCommand
        tool={tool}
        parameterValues={{ "-list": "urls.txt", "-target": "example.com" }}
      />,
    );
    const output = screen.getByText(/httpx/);
    expect(output.textContent).toBe("httpx -list urls.txt -target example.com");
  });

  it("generates command with only tool name when root-only tool has no values set", () => {
    const tool = {
      binaryName: "httpx",
      displayName: "Httpx",
      commands: [],
      parameters: [
        {
          key: "-list",
          displayName: "List",
          parameterType: "Option" as const,
          dataType: "String" as const,
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
          commands: [
            {
              key: "--curl",
              displayName: "curl",
              sortOrder: 1,
              parameters: [
                {
                  key: "url",
                  displayName: "URL",
                  parameterType: "Argument",
                  dataType: "String",
                  position: 1,
                  sortOrder: 1,
                },
              ],
            },
          ],
          parameters: [],
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
      commands: [{ key: "--sub", displayName: "sub", sortOrder: 0 }],
      parameters: [
        {
          key: "--verbose",
          displayName: "Verbose",
          parameterType: "Flag" as const,
          dataType: "Boolean" as const,
          aliases: ["--verbose"],
          sortOrder: 1,
        },
        {
          key: "--output",
          displayName: "Output",
          parameterType: "Option" as const,
          dataType: "String" as const,
          aliases: ["--output"],
          sortOrder: 2,
        },
      ],
    };
    render(
      <GeneratedCommand
        tool={tool}
        selectedCommand={null}
        parameterValues={{ "--verbose": true }}
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
        {
          key: "config",
          displayName: "config",
          sortOrder: 0,
          commands: [
            {
              key: "get",
              displayName: "get",
              sortOrder: 0,
              parameters: [
                {
                  key: "key-param",
                  displayName: "Key",
                  parameterType: "Argument" as const,
                  dataType: "String" as const,
                  position: 1,
                  sortOrder: 1,
                },
              ],
            },
          ],
        },
      ],
      parameters: [],
    };
    render(
      <GeneratedCommand
        tool={tool}
        selectedCommand={tool.commands[0].commands![0]}
        parameterValues={{ "key-param": "app.name" }}
      />,
    );
    const output = screen.getByText(/mycli/);
    expect(output.textContent).toBe("mycli config get app.name");
  });

  it("emits the alias at the requested index", () => {
    const tool = {
      binaryName: "curl",
      displayName: "Curl",
      commands: [],
      parameters: [
        {
          key: "--request",
          displayName: "Request",
          parameterType: "Option" as const,
          dataType: "String" as const,
          aliases: ["-X"],
          sortOrder: 1,
        },
      ],
    };

    render(
      <GeneratedCommand
        tool={tool}
        parameterValues={{ "--request": "POST" }}
        defaultFlagFormIndex={1}
      />,
    );

    const output = screen.getByText(/curl/);
    expect(output.textContent).toBe("curl -X POST");
  });

  it("toggles between short and long flags from the UI", () => {
    const tool = {
      binaryName: "curl",
      displayName: "Curl",
      commands: [],
      parameters: [
        {
          key: "--request",
          displayName: "Request",
          parameterType: "Option" as const,
          dataType: "String" as const,
          aliases: ["-X", "--request"],
          sortOrder: 1,
        },
      ],
    };

    render(
      <GeneratedCommand
        tool={tool}
        parameterValues={{ "--request": "POST" }}
      >
        <GeneratedCommand.Header>
          <GeneratedCommand.FlagFormPreference />
        </GeneratedCommand.Header>
        <GeneratedCommand.Output />
        <GeneratedCommand.Actions />
      </GeneratedCommand>,
    );

    expect(screen.getByText("curl --request POST")).toBeInTheDocument();
    expect(screen.getByText(/generated command/i)).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /flag style/i })).toBeInTheDocument();
  });

  it("allows composing a custom toolbar without affecting default actions", () => {
    const tool = {
      binaryName: "curl",
      displayName: "Curl",
      commands: [],
      parameters: [
        {
          key: "--request",
          displayName: "Request",
          parameterType: "Option" as const,
          dataType: "String" as const,
          aliases: ["-X", "--request"],
          sortOrder: 1,
        },
      ],
    };

    render(
      <GeneratedCommand
        tool={tool}
        parameterValues={{ "--request": "POST" }}
      >
        <GeneratedCommand.Header>
          <span>Custom Controls</span>
        </GeneratedCommand.Header>
        <GeneratedCommand.Toolbar>
          <GeneratedCommand.FlagFormPreference />
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
      commands: [],
      parameters: [
        {
          key: "--request",
          displayName: "Request",
          parameterType: "Option" as const,
          dataType: "String" as const,
          aliases: ["-X", "--request"],
          sortOrder: 1,
        },
      ],
    };

    render(
      <GeneratedCommand
        tool={tool}
        parameterValues={{ "--request": "POST" }}
      >
        <GeneratedCommand.Output />
      </GeneratedCommand>,
    );

    expect(screen.getByText("curl --request POST")).toBeInTheDocument();
    expect(screen.queryByText(/generated command/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: /flag style/i })).not.toBeInTheDocument();
  });
});

describe("generateCommand", () => {
  it("emits the canonical flag derived from the key by default", () => {
    const command = generateCommand(
      {
        binaryName: "curl",
        displayName: "Curl",
        commands: [
          {
            key: "--curl",
            displayName: "curl",
            sortOrder: 1,
            parameters: [
              {
                key: "--request",
                displayName: "Request",
                parameterType: "Option",
                dataType: "String",
                aliases: ["-X"],
                sortOrder: 1,
              },
              {
                key: "--verbose",
                displayName: "Verbose",
                parameterType: "Flag",
                dataType: "Boolean",
                aliases: ["-v"],
                sortOrder: 2,
              },
            ],
          },
        ],
        parameters: [],
      },
      { "--request": "POST", "--verbose": true },
    );

    expect(command).toBe("curl --request POST --verbose");
  });

  it("emits the alias at the requested index", () => {
    const command = generateCommand(
      {
        binaryName: "curl",
        displayName: "Curl",
        commands: [
          {
            key: "--curl",
            displayName: "curl",
            sortOrder: 1,
            parameters: [
              {
                key: "--request",
                displayName: "Request",
                parameterType: "Option",
                dataType: "String",
                aliases: ["-X"],
                sortOrder: 1,
              },
              {
                key: "--verbose",
                displayName: "Verbose",
                parameterType: "Flag",
                dataType: "Boolean",
                aliases: ["-v"],
                sortOrder: 2,
              },
            ],
          },
        ],
        parameters: [],
      },
      { "--request": "POST", "--verbose": true },
      { flagFormIndex: 1 },
    );

    expect(command).toBe("curl -X POST -v");
  });

  it("emits single-dash keys verbatim", () => {
    const command = generateCommand(
      {
        binaryName: "httpx",
        displayName: "Httpx",
        commands: [],
        parameters: [
          {
            key: "-list",
            displayName: "List",
            parameterType: "Option",
            dataType: "String",
            aliases: ["-l"],
          },
        ],
      },
      { "-list": "urls.txt" },
    );

    expect(command).toBe("httpx -list urls.txt");
  });

  it("falls back to the canonical flag when the index exceeds the alias list", () => {
    const command = generateCommand(
      {
        binaryName: "curl",
        displayName: "Curl",
        commands: [
          {
            key: "--curl",
            displayName: "curl",
            sortOrder: 1,
            parameters: [
              {
                key: "--request",
                displayName: "Request",
                parameterType: "Option",
                dataType: "String",
                aliases: ["-X"],
                sortOrder: 1,
              },
            ],
          },
        ],
        parameters: [],
      },
      { "--request": "POST" },
      { flagFormIndex: 4 },
    );

    expect(command).toBe("curl --request POST");
  });

  it("matches root and recursive parameter handling when no command is selected", () => {
    const command = generateCommand(
      {
        binaryName: "mycli",
        displayName: "My CLI",
        commands: [
          {
            key: "--sub",
            displayName: "sub",
            sortOrder: 0,
            parameters: [
              {
                key: "--output",
                displayName: "Output",
                parameterType: "Option",
                dataType: "String",
                aliases: ["--output"],
                sortOrder: 3,
              },
            ],
          },
        ],
        parameters: [
          {
            key: "--verbose",
            displayName: "Verbose",
            parameterType: "Flag",
            dataType: "Boolean",
            aliases: ["--verbose"],
            recursive: true,
            sortOrder: 1,
          },
          {
            key: "--config",
            displayName: "Config",
            parameterType: "Option",
            dataType: "String",
            aliases: ["--config"],
            sortOrder: 2,
          },
        ],
      },
      { "--verbose": true, "--config": "app.json", "--output": "ignored.txt" },
      { selectedCommand: null },
    );

    expect(command).toBe("mycli --verbose --config app.json");
  });
});

describe("resolveApplicableParameters", () => {
  const nestedTool = {
    binaryName: "mycli",
    displayName: "My CLI",
    commands: [
      {
        key: "config",
        displayName: "config",
        sortOrder: 0,
        parameters: [
          {
            key: "--inherited",
            displayName: "Inherited",
            parameterType: "Flag" as const,
            dataType: "Boolean" as const,
            aliases: ["-i"],
            recursive: true,
            sortOrder: 2,
          },
          {
            key: "--scoped",
            displayName: "Scoped",
            parameterType: "Flag" as const,
            dataType: "Boolean" as const,
            aliases: ["-s"],
            sortOrder: 3,
          },
        ],
        commands: [
          {
            key: "get",
            displayName: "get",
            sortOrder: 0,
            parameters: [
              {
                key: "--child",
                displayName: "Child",
                parameterType: "Flag" as const,
                dataType: "Boolean" as const,
                aliases: ["-g"],
                sortOrder: 4,
              },
            ],
          },
        ],
      },
      { key: "other", displayName: "other", sortOrder: 0 },
    ],
    parameters: [
      {
        key: "--common",
        displayName: "Common",
        parameterType: "Flag" as const,
        dataType: "Boolean" as const,
        aliases: ["-c"],
        recursive: true,
        sortOrder: 1,
      },
    ],
  };

  it("applies recursive parameters to descendant subcommands", () => {
    const keys = resolveApplicableParameters(nestedTool, nestedTool.commands[0].commands![0]).map(
      (p) => p.key,
    );
    expect(keys).toEqual(["--common", "--inherited", "--child"]);
  });

  it("does not apply recursive parameters to unrelated commands", () => {
    const keys = resolveApplicableParameters(nestedTool, nestedTool.commands[1]).map((p) => p.key);
    expect(keys).toEqual(["--common"]);
  });

  it("applies a root-scoped recursive parameter to every command", () => {
    for (const command of getAllCommands(nestedTool)) {
      const keys = resolveApplicableParameters(nestedTool, command).map((p) => p.key);
      expect(keys).toContain("--common");
    }
  });

  it("returns only root parameters when no command is selected", () => {
    const keys = resolveApplicableParameters(nestedTool, null).map((p) => p.key);
    expect(keys).toEqual(["--common"]);
  });
});
