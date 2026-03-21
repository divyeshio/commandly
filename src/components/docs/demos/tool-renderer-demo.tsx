import type { Tool } from "@/commandly/lib/types/flat";
import { ToolRenderer } from "@/commandly/tool-renderer";
import { useState } from "react";

const sampleTool: Tool = {
  name: "curl",
  displayName: "curl",
  info: {
    description: "Transfer data with URLs",
  },
  commands: [{ key: "curl", name: "curl", isDefault: true }],
  parameters: [
    {
      key: "url",
      name: "url",
      parameterType: "Option",
      dataType: "String",
      longFlag: "--url",
      shortFlag: "",
      isRequired: true,
      isRepeatable: false,
      isGlobal: false,
      description: "URL to fetch",
      commandKey: "curl",
    },
    {
      key: "request",
      name: "request",
      parameterType: "Option",
      dataType: "String",
      longFlag: "--request",
      shortFlag: "-X",
      isRequired: false,
      isRepeatable: false,
      isGlobal: false,
      description: "HTTP method (GET, POST, PUT, etc.)",
      commandKey: "curl",
    },
    {
      key: "header",
      name: "header",
      parameterType: "Option",
      dataType: "String",
      longFlag: "--header",
      shortFlag: "-H",
      isRequired: false,
      isRepeatable: true,
      isGlobal: false,
      description: "Extra header to include in request",
      commandKey: "curl",
    },
    {
      key: "data",
      name: "data",
      parameterType: "Option",
      dataType: "String",
      longFlag: "--data",
      shortFlag: "-d",
      isRequired: false,
      isRepeatable: false,
      isGlobal: false,
      description: "HTTP POST data",
      commandKey: "curl",
    },
    {
      key: "verbose",
      name: "verbose",
      parameterType: "Flag",
      dataType: "Boolean",
      longFlag: "--verbose",
      shortFlag: "-v",
      isRequired: false,
      isRepeatable: false,
      isGlobal: false,
      description: "Make the operation more talkative",
      commandKey: "curl",
    },
    {
      key: "silent",
      name: "silent",
      parameterType: "Flag",
      dataType: "Boolean",
      longFlag: "--silent",
      shortFlag: "-s",
      isRequired: false,
      isRepeatable: false,
      isGlobal: false,
      description: "Silent mode",
      commandKey: "curl",
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
