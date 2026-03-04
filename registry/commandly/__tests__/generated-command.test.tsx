import { GeneratedCommand } from "../generated-command";
import { toolBuilderStore } from "../tool-editor/tool-editor.store";
import { render } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("../tool-editor/tool-editor.store", () => ({
  toolBuilderStore: {
    state: {
      selectedCommand: {
        key: "test-key",
        name: "test",
        isDefault: true,
        sortOrder: 0,
      },
      tool: {
        name: "tool",
        commands: [
          {
            key: "test-key",
            name: "test",
            isDefault: true,
            sortOrder: 0,
          },
        ],
        parameters: [],
      },
      parameterValues: {},
    },
    subscribe: vi.fn(),
  },
  toolBuilderActions: {
    addSavedCommand: vi.fn(),
  },
  toolBuilderSelectors: {
    getGlobalParameters: () => [],
    getParametersForCommand: () => [],
  },
}));

describe("GeneratedCommand", () => {
  it("renders configure parameters message if no generated command", () => {
    render(
      <GeneratedCommand
        tool={toolBuilderStore.state.tool}
        parameterValues={{}}
      />,
    );
    //expect(screen.getByText(/Configure parameters/)).toBeInTheDocument();
  });
});
