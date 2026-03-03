import {
  ToolBuilderState,
  toolBuilderStore,
  toolBuilderActions,
  toolBuilderSelectors,
} from "./tool-editor.store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExclusionGroup, ParameterType } from "@/registry/commandly/lib/types/commandly";
import { createNewParameter, validateDefaultValue } from "@/registry/commandly/lib/utils/commandly";
import { useStore } from "@tanstack/react-store";
import {
  CheckCircleIcon,
  FileTextIcon,
  FlagIcon,
  GlobeIcon,
  HashIcon,
  LayersIcon,
  PlusIcon,
  Trash2Icon,
  XCircleIcon,
} from "lucide-react";

interface ParameterListProps {
  title: string;
  isGlobal?: boolean;
}

function ParameterIcon({ type }: { type: ParameterType }) {
  switch (type) {
    case "Flag":
      return <FlagIcon className="h-4 w-4" />;
    case "Option":
      return <HashIcon className="h-4 w-4" />;
    case "Argument":
      return <FileTextIcon className="h-4 w-4" />;
    default:
      return <HashIcon className="h-4 w-4" />;
  }
}

export function ParameterList({ title, isGlobal = false }: ParameterListProps) {
  const selectedCommand = useStore(toolBuilderStore, (state) => state.selectedCommand);
  const globalParameters = useStore(toolBuilderStore, (state) =>
    toolBuilderSelectors.getGlobalParameters(state),
  );
  const commandParameters = useStore(toolBuilderStore, (state: ToolBuilderState) =>
    selectedCommand?.id
      ? toolBuilderSelectors.getParametersForCommand(state, selectedCommand.id)
      : [],
  );
  const exclusionGroups = useStore(toolBuilderStore, (state: ToolBuilderState) =>
    selectedCommand?.id
      ? toolBuilderSelectors.getExclusionGroupsForCommand(state, selectedCommand.id)
      : [],
  );

  const parameters = isGlobal ? globalParameters : commandParameters;

  const getParameterExclusionGroups = (parameterId: string): ExclusionGroup[] => {
    return exclusionGroups.filter((group) => group.parameterIds.includes(parameterId));
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          {isGlobal && <GlobeIcon className="h-5 w-5" />}
          {title} ({parameters.length})
        </h3>
        <Button
          onClick={() =>
            toolBuilderActions.setSelectedParameter(
              createNewParameter(isGlobal, selectedCommand?.id),
            )
          }
          size="sm"
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {parameters.map((parameter) => {
          const validation = validateDefaultValue(parameter);
          const paramGroups = getParameterExclusionGroups(parameter.id);

          return (
            <div
              key={parameter.id}
              className={"cursor-pointer rounded border p-3 hover:bg-muted/50"}
              onClick={() => toolBuilderActions.setSelectedParameter(parameter)}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ParameterIcon type={parameter.parameterType} />
                  <span className="text-sm font-medium">
                    {parameter.name}
                    {(parameter.longFlag || parameter.shortFlag) && (
                      <span className="ml-1 text-muted-foreground">
                        ({[parameter.longFlag, parameter.shortFlag].filter(Boolean).join(", ")})
                      </span>
                    )}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    toolBuilderActions.removeParameter(parameter.id);
                  }}
                >
                  <Trash2Icon className="h-3 w-3 text-destructive" />
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                {parameter.isRequired && (
                  <Badge
                    variant="destructive"
                    className="text-xs"
                  >
                    required
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className="text-xs"
                >
                  {parameter.parameterType}
                </Badge>
                <Badge
                  variant="secondary"
                  className="text-xs"
                >
                  {parameter.dataType}
                </Badge>
                {isGlobal && (
                  <Badge
                    variant="default"
                    className="text-xs"
                  >
                    global
                  </Badge>
                )}
                {paramGroups.map((group) => (
                  <Badge
                    key={group.id}
                    variant="secondary"
                    className="flex items-center gap-1 bg-muted text-xs"
                  >
                    <LayersIcon className="h-3 w-3" />
                    {group.name}
                  </Badge>
                ))}
                {!validation.isValid && <XCircleIcon className="h-3 w-3 text-destructive" />}
                {validation.isValid && parameter.defaultValue && (
                  <CheckCircleIcon className="h-3 w-3 text-green-500" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
