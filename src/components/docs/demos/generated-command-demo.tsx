import { GeneratedCommand } from "@/registry/commandly/generated-command";
import type { Tool } from "@/registry/commandly/lib/types/commandly";
import { useState } from "react";

const sampleTool: Tool = {
  name: "subfinder",
  displayName: "Subfinder",
  description: "Fast passive subdomain enumeration tool",
  commands: [{ key: "subfinder", name: "subfinder", isDefault: true }],
  parameters: [
    {
      key: "domain",
      name: "domain",
      parameterType: "Option",
      dataType: "String",
      longFlag: "-d",
      shortFlag: "",
      isRequired: true,
      isRepeatable: false,
      isGlobal: false,
      description: "Target domain to enumerate",
      commandKey: "subfinder",
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
      description: "Show only results in output",
      commandKey: "subfinder",
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
      commandKey: "subfinder",
    },
  ],
};

export function GeneratedCommandDemo() {
  const [parameterValues] = useState<Record<string, string | boolean>>({
    domain: "example.com",
    silent: false,
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
