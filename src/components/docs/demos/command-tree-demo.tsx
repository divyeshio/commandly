import { sampleTool } from "./sample-tool";
import { CommandTree } from "@/components/commandly/command-tree";
import { getDefaultCommand } from "@/components/commandly/utils/tool";
import { useState } from "react";

export function CommandTreeDemo() {
  const [selectedCommand, setSelectedCommand] = useState(() => getDefaultCommand(sampleTool));

  return (
    <div className="h-72 w-full max-w-xs rounded-lg border bg-card p-3">
      <CommandTree
        tool={sampleTool}
        selectedCommand={selectedCommand}
        onSelectCommand={setSelectedCommand}
      />
    </div>
  );
}
