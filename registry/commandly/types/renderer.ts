import type { Parameter, ParameterValue } from "@/commandly/types/flat";
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
