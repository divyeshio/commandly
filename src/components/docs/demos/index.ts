import { CommandTreeDemo } from "./command-tree-demo";
import commandTreeCode from "./command-tree-demo.tsx?raw";
import { GeneratedCommandDemo } from "./generated-command-demo";
import generatedCommandCode from "./generated-command-demo.tsx?raw";
import { InstallationDemo } from "./installation-demo";
import installationCode from "./installation-demo.tsx?raw";
import { JsonOutputDemo } from "./json-output-demo";
import jsonOutputCode from "./json-output-demo.tsx?raw";
import { ToolRendererDemo } from "./tool-renderer-demo";
import toolRendererCode from "./tool-renderer-demo.tsx?raw";
import type { ComponentType } from "react";

export interface DemoEntry {
  component: ComponentType;
  code: string;
}

export const demos: Record<string, DemoEntry> = {
  "command-tree": {
    component: CommandTreeDemo,
    code: commandTreeCode,
  },
  "generated-command": {
    component: GeneratedCommandDemo,
    code: generatedCommandCode,
  },
  installation: {
    component: InstallationDemo,
    code: installationCode,
  },
  "json-output": {
    component: JsonOutputDemo,
    code: jsonOutputCode,
  },
  "tool-renderer": {
    component: ToolRendererDemo,
    code: toolRendererCode,
  },
};
