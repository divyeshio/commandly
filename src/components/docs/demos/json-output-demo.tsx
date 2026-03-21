import { JsonOutput } from "@/commandly/json-output";
import type { Tool } from "@/commandly/lib/types/flat";

const sampleTool: Tool = {
  name: "curl",
  displayName: "curl",
  info: {
    description: "Transfer data to or from a server",
  },
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

export function JsonOutputDemo() {
  return (
    <div className="w-full max-w-xl">
      <JsonOutput tool={sampleTool} />
    </div>
  );
}
