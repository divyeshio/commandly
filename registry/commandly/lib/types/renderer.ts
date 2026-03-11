import type { Parameter, ParameterValue } from "@/registry/commandly/lib/types/commandly";
import type { ReactElement } from "react";

export type ParameterRenderContext = {
  parameter: Parameter;
  value: ParameterValue;
  onUpdate: (value: ParameterValue) => void;
};

export type ParameterRendererEntry = {
  condition: (parameter: Parameter) => boolean;
  component: (context: ParameterRenderContext) => ReactElement | null;
};
