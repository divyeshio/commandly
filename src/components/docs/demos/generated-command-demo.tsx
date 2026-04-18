import { GeneratedCommand } from "@/components/commandly/generated-command";
import type { Tool } from "@/components/commandly/types/flat";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

const sampleTool: Tool = {
  binaryName: "curl",
  displayName: "curl",
  info: {
    description: "Transfer data to or from a server",
  },
  commands: [{ key: "curl", name: "curl" }],
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
      <Card>
        <GeneratedCommand
          tool={sampleTool}
          selectedCommand={sampleTool.commands[0]}
          parameterValues={parameterValues}
          onSaveCommand={(cmd) => console.log("Saved:", cmd)}
        >
          <GeneratedCommand.Header>
            <GeneratedCommand.FlagPreference />
          </GeneratedCommand.Header>
          <CardContent className="space-y-4">
            <GeneratedCommand.Output />
            <GeneratedCommand.Actions />
          </CardContent>
        </GeneratedCommand>
      </Card>
    </div>
  );
}
