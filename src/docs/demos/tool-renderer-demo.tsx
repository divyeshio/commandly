import type { Tool } from "@/registry/commandly/lib/types/commandly";
import { ToolRenderer } from "@/registry/commandly/tool-renderer";
import { useState } from "react";

const sampleTool: Tool = {
  name: "httpx",
  displayName: "httpx",
  description: "Fast HTTP toolkit",
  commands: [{ key: "httpx", name: "httpx", isDefault: true }],
  parameters: [
    {
      key: "url",
      name: "url",
      parameterType: "Option",
      dataType: "String",
      longFlag: "-u",
      shortFlag: "",
      isRequired: true,
      isRepeatable: false,
      isGlobal: false,
      description: "Target URL to probe",
      commandKey: "httpx",
    },
    {
      key: "status_code",
      name: "status-code",
      parameterType: "Flag",
      dataType: "Boolean",
      longFlag: "--status-code",
      shortFlag: "-sc",
      isRequired: false,
      isRepeatable: false,
      isGlobal: false,
      description: "Display response status code",
      commandKey: "httpx",
    },
    {
      key: "threads",
      name: "threads",
      parameterType: "Option",
      dataType: "Number",
      longFlag: "-t",
      shortFlag: "",
      isRequired: false,
      isRepeatable: false,
      isGlobal: false,
      description: "Number of threads",
      commandKey: "httpx",
      defaultValue: "50",
    },
  ],
};

export function ToolRendererDemo() {
  const [values, setValues] = useState<Record<string, string | boolean | number>>({});

  return (
    <div className="w-full max-w-sm rounded-lg border bg-card p-4">
      <ToolRenderer
        tool={sampleTool}
        parameterValues={values}
        updateParameterValue={(key, val) => setValues((prev) => ({ ...prev, [key]: val }))}
      />
    </div>
  );
}
