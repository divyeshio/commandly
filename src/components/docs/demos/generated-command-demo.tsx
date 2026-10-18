import { sampleTool } from "./sample-tool";
import { GeneratedCommand } from "@/components/commandly/generated-command";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

export function GeneratedCommandDemo() {
  const [parameterValues] = useState<Record<string, string | boolean>>({
    url: "https://example.com",
    "--request": "GET",
    "--output": "",
  });

  return (
    <div className="w-full max-w-xl">
      <Card>
        <GeneratedCommand
          tool={sampleTool}
          selectedCommand={null}
          parameterValues={parameterValues}
          onSaveCommand={(cmd) => console.log("Saved:", cmd)}
        >
          <GeneratedCommand.Header>
            <GeneratedCommand.FlagFormPreference />
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
