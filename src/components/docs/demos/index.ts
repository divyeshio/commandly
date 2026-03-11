import { GeneratedCommandDemo } from "./generated-command-demo";
import generatedCommandCode from "./generated-command-demo.tsx?raw";
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
  "generated-command": {
    component: GeneratedCommandDemo,
    code: generatedCommandCode,
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
