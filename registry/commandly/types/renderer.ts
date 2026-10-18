import type { Parameter, ParameterValue } from "@/components/commandly/types/tool";
import type { ReactElement } from "react";

export type ParameterRenderContext = {
  parameter: Parameter;
  /** The parameter's invocation forms: the canonical flag plus its short and other names. */
  flags: string[];
  value: ParameterValue;
  onUpdate: (value: ParameterValue) => void;
  /** Whether the parameter must be provided, counting any `required_one_of` group it belongs to. */
  isRequired?: boolean;
  /** The exclusion group ruling this parameter out, once another of its members is provided. */
  excludedBy?: string;
};

export type ParameterRendererEntry = {
  condition: (parameter: Parameter) => boolean;
  component: (context: ParameterRenderContext) => ReactElement | null;
};
