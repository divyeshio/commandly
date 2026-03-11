import { GeneratedCommand } from "@/registry/commandly/generated-command";
import type { Tool } from "@/registry/commandly/lib/types/commandly";
import { useState } from "react";

const sampleTool: Tool = {
  name: "curl",
  displayName: "curl",
  description: "Transfer data to or from a server",
  commands: [{ key: "curl", name: "curl", isDefault: true }],
  parameters: [
    {
      key: "url",
      name: "url",
      parameterType: "Argument",
      dataType: "String",
      longFlag: "",
      shortFlag: "",
      isRequired: true,
      isRepeatable: false,
      isGlobal: false,
      description: "URL to fetch",
      commandKey: "curl",
    },
    {
      key: "method",
      name: "method",
      parameterType: "Option",
      dataType: "String",
      longFlag: "-X",
      shortFlag: "",
      isRequired: false,
      isRepeatable: false,
      isGlobal: false,
      description: "HTTP method (GET, POST, etc.)",
      commandKey: "curl",
    },
    {
      key: "output",
      name: "output",
      parameterType: "Option",
      dataType: "String",
      longFlag: "-o",
      shortFlag: "",
      isRequired: false,
      isRepeatable: false,
      isGlobal: false,
      description: "File to write output to",
      commandKey: "curl",
    },
  ],
};

export function GeneratedCommandDemo() {
  const [parameterValues] = useState<Record<string, string | boolean>>({
    url: "https://example.com",
    method: "GET",
    output: "",
  });

  return (
    <div className="w-full max-w-xl">
      <GeneratedCommand
        tool={sampleTool}
        selectedCommand={sampleTool.commands[0]}
        parameterValues={parameterValues}
        onSaveCommand={(cmd) => console.log("Saved:", cmd)}
      />
    </div>
  );
}
