import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ExclusionGroup, ParameterType } from "../../lib/types/tool-editor";
import {
  CheckCircleIcon,
  FileTextIcon,
  FlagIcon,
  GlobeIcon,
  HashIcon,
  LayersIcon,
  PlusIcon,
  Trash2Icon,
  XCircleIcon
} from "lucide-react";
import { useStore } from "@tanstack/react-store";
import {
  toolBuilderStore,
  toolBuilderActions,
  toolBuilderSelectors
} from "./tool-editor.store";
import {
  createNewParameter,
  validateDefaultValue
} from "../../lib/utils/tool-editor";

interface ParameterListProps {
  title: string;
  isGlobal?: boolean;
}

export function ParameterList({ title, isGlobal = false }: ParameterListProps) {
  const selectedCommand = useStore(
    toolBuilderStore,
    (state) => state.selectedCommand
  );
  const selectedParameter = useStore(
    toolBuilderStore,
    (state) => state.selectedParameter
  );
  const globalParameters = useStore(toolBuilderStore, (state) =>
    toolBuilderSelectors.getGlobalParameters(state)
  );
  const commandParameters = useStore(toolBuilderStore, (state) =>
    selectedCommand?.id
      ? toolBuilderSelectors.getParametersForCommand(state, selectedCommand.id)
      : []
  );
  const exclusionGroups = useStore(toolBuilderStore, (state) =>
    selectedCommand?.id
      ? toolBuilderSelectors.getExclusionGroupsForCommand(
          state,
          selectedCommand.id
        )
      : []
  );

  const parameters = isGlobal ? globalParameters : commandParameters;

  const getParameterIcon = (parameterType: ParameterType) => {
    switch (parameterType) {
      case "Flag":
        return <FlagIcon className="h-4 w-4" />;
      case "Option":
        return <HashIcon className="h-4 w-4" />;
      case "Argument":
        return <FileTextIcon className="h-4 w-4" />;
      default:
        return <HashIcon className="h-4 w-4" />;
    }
  };

  const getParameterExclusionGroups = (
    parameterId: string
  ): ExclusionGroup[] => {
    return exclusionGroups.filter((group) =>
      group.parameterIds.includes(parameterId)
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          {isGlobal && <GlobeIcon className="h-5 w-5" />}
          {title} ({parameters.length})
        </h3>
        <Button
          onClick={() =>
            toolBuilderActions.setSelectedParameter(
              createNewParameter(isGlobal, selectedCommand?.id)
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
          const isSelected = selectedParameter?.id === parameter.id;
          const paramGroups = getParameterExclusionGroups(parameter.id);

          return (
            <div
              key={parameter.id}
              className={`p-3 border rounded cursor-pointer hover:bg-muted/50 ${
                isSelected ? "bg-muted border-primary" : ""
              }`}
              onClick={() => toolBuilderActions.setSelectedParameter(parameter)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getParameterIcon(parameter.parameterType)}
                  <span className="font-medium text-sm">
                    {parameter.name}
                    {(parameter.longFlag || parameter.shortFlag) && (
                      <span className="text-muted-foreground ml-1">
                        (
                        {[parameter.longFlag, parameter.shortFlag]
                          .filter(Boolean)
                          .join(", ")}
                        )
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
              <div className="flex items-center gap-1 flex-wrap">
                {parameter.isRequired && (
                  <Badge variant="destructive" className="text-xs">
                    required
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {parameter.parameterType}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {parameter.dataType}
                </Badge>
                {isGlobal && (
                  <Badge variant="default" className="text-xs">
                    global
                  </Badge>
                )}
                {paramGroups.map((group) => (
                  <Badge
                    key={group.id}
                    variant="secondary"
                    className="text-xs bg-muted flex items-center gap-1"
                  >
                    <LayersIcon className="h-3 w-3" />
                    {group.name}
                  </Badge>
                ))}
                {!validation.isValid && (
                  <XCircleIcon className="h-3 w-3 text-destructive" />
                )}
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
