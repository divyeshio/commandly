import { sampleTool } from "./sample-tool";
import { InstallationSection } from "@/components/commandly/installation";

export function InstallationDemo() {
  return (
    <div className="w-full max-w-xl rounded-lg border bg-card p-4">
      <InstallationSection installation={sampleTool.installation} />
    </div>
  );
}
