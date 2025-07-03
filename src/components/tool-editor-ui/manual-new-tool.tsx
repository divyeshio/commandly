import { useState } from "react";
import { Tool, ManualNewTool } from "@/lib/types/tool-editor";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

export function ManualNewToolComponent() {
  const [manualNewTool, setManualTool] = useState<ManualNewTool>({
    name: "",
    displayName: "",
    description: "",
    version: ""
  });

  const handleInputChange =
    (name: keyof typeof manualNewTool) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setManualTool((prev) => ({ ...prev, [name]: value }));
    };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-3">
          <Label htmlFor="tool-name-full">
            Tool Name<span className="text-destructive ml-1">*</span>
          </Label>
          <Input
            required
            id="tool-name-full"
            value={manualNewTool.name}
            onChange={handleInputChange("name")}
          />
        </div>
        <div className="flex flex-col gap-3">
          <Label htmlFor="tool-version-full">Version</Label>
          <Input
            id="tool-version-full"
            value={manualNewTool.version}
            onChange={handleInputChange("version")}
          />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <Label htmlFor="tool-display-name">
          Display Name<span className="text-destructive ml-1">*</span>
        </Label>
        <Input
          required
          id="tool-display-name"
          value={manualNewTool.displayName}
          onChange={handleInputChange("displayName")}
        />
      </div>
      <div className="flex flex-col gap-3">
        <Label htmlFor="tool-description">Description</Label>
        <Textarea
          id="tool-description"
          value={manualNewTool.description}
          onChange={handleInputChange("description")}
          rows={3}
        />
      </div>
    </div>
  );
}
