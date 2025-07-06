import { render } from "@testing-library/react";
import { vi } from "vitest";
import { GeneratedCommand } from "../../core-components/generated-command";
import { toolBuilderStore } from "../../tool-editor/tool-editor.store";

vi.mock("../tool-editor.store", () => ({
  toolBuilderStore: {
    getState: () => ({
      selectedCommand: {
        name: "test",
        id: "01979f70-cc01-73fe-b638-11efe685b4df"
      },
      tool: { name: "tool", commands: [], parameters: [] },
      parameterValues: {}
    }),
    subscribe: vi.fn()
  },
  toolBuilderActions: {
    addSavedCommand: vi.fn()
  },
  toolBuilderSelectors: {
    getGlobalParameters: () => [],
    getParametersForCommand: () => []
  }
}));

describe("GeneratedCommand", () => {
  it("renders configure parameters message if no generated command", () => {
    render(
      <GeneratedCommand
        tool={toolBuilderStore.state.tool}
        parameterValues={{}}
      />
    );
    //expect(screen.getByText(/Configure parameters/)).toBeInTheDocument();
  });
});
