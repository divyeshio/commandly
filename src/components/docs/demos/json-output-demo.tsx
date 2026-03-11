import { JsonOutput } from "@/registry/commandly/json-output";
import type { Tool } from "@/registry/commandly/lib/types/commandly";

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
  ],
};

export function JsonOutputDemo() {
  return (
    <div className="w-full max-w-xl">
      <JsonOutput tool={sampleTool} />
    </div>
  );
}
