import { sampleTool } from "./sample-tool";
import { ToolRenderer } from "@/components/commandly/tool-renderer";
import type { ParameterValue } from "@/components/commandly/types/tool";
import { useState } from "react";

export function ToolRendererDemo() {
  const [values, setValues] = useState<Record<string, ParameterValue>>({});

  return (
    <div className="w-full max-w-sm rounded-lg border bg-card p-4">
      <ToolRenderer
        tool={sampleTool}
        selectedCommand={null}
        parameterValues={values}
        updateParameterValue={(key, val) => setValues((prev) => ({ ...prev, [key]: val }))}
      />
    </div>
  );
}
