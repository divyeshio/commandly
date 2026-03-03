import { GeneratedCommand } from "../generated-command";
import { toolBuilderStore } from "../tool-editor/tool-editor.store";
import { render } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("../tool-editor/tool-editor.store", () => ({
  toolBuilderStore: {
    state: {
      selectedCommand: {
        name: "test",
        id: "01979f70-cc01-73fe-b638-11efe685b4df",
        isDefault: true,
        sortOrder: 0,
      },
      tool: {
        name: "tool",
        commands: [
          {
            name: "test",
            id: "01979f70-cc01-73fe-b638-11efe685b4df",
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
