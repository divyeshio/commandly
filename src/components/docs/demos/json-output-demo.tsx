import { sampleTool } from "./sample-tool";
import { JsonOutput } from "@/components/commandly/json-output";

export function JsonOutputDemo() {
  return (
    <div className="w-full max-w-xl">
      <JsonOutput tool={sampleTool} />
    </div>
  );
}
