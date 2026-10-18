import { createTestCommand, defaultTool } from "../../test-utils";
import { Command, Parameter } from "@/components/commandly/types/tool";
import { ParameterDetailsDialog } from "@/components/tool-editor/dialogs/parameter-details-dialog";
import {
  ToolBuilderProvider,
  ToolBuilderState,
  useToolBuilder,
} from "@/components/tool-editor/tool-editor.context";
import { render } from "@testing-library/react";

/** The state the editor sees while a parameter is open: the selected command declares it. */
export const createTestState = (
  parameter: Parameter | null,
  toolName: string = "test-tool",
  command?: Command,
): Partial<ToolBuilderState> => {
  const selectedCommand = command ?? createTestCommand();
  return {
    tool: {
      ...defaultTool(toolName, "Test tool"),
      binaryName: toolName,
      commands: [
        parameter
          ? { ...selectedCommand, parameters: [...(selectedCommand.parameters ?? []), parameter] }
          : selectedCommand,
      ],
    },
    selectedCommandKey: selectedCommand.key,
    selectedParameter: parameter,
  };
};

/** The context value as of the most recent render, for tests that drive the provider directly. */
export let capturedCtx: ReturnType<typeof useToolBuilder>;

function ContextCapture() {
  capturedCtx = useToolBuilder();
  return null;
}

function DialogWrapper() {
  const { selectedParameter, upsertParameter, setSelectedParameter } = useToolBuilder();
  if (!selectedParameter) return null;
  return (
    <ParameterDetailsDialog
      parameter={selectedParameter.key ? selectedParameter : undefined}
      onSave={(param) => {
        upsertParameter(param, selectedParameter.key || undefined);
        setSelectedParameter(null);
      }}
    />
  );
}

export function renderWithProvider(initialState: Partial<ToolBuilderState>) {
  return render(
    <ToolBuilderProvider
      tool={initialState.tool ?? defaultTool("test-tool", "Test tool")}
      initialState={initialState}
    >
      <DialogWrapper />
      <ContextCapture />
    </ToolBuilderProvider>,
  );
}
