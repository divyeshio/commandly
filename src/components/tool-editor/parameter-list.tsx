import { useToolBuilder } from "./tool-editor.context";
import { ExclusionGroup, ParameterType } from "@/components/commandly/types/flat";
import { createNewParameter } from "@/components/commandly/utils/flat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileTextIcon,
  FlagIcon,
  GlobeIcon,
  HashIcon,
  LayersIcon,
  PlusIcon,
  Trash2Icon,
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
  const {
    selectedCommand,
    getGlobalParameters,
    getParametersForCommand,
    getExclusionGroupsForCommand,
    setSelectedParameter,
    removeParameter,
  } = useToolBuilder();

  const globalParameters = getGlobalParameters();
  const commandParameters = selectedCommand?.key
    ? getParametersForCommand(selectedCommand.key)
    : [];
  const exclusionGroups = selectedCommand?.key
    ? getExclusionGroupsForCommand(selectedCommand.key)
    : [];

  const parameters = isGlobal ? globalParameters : commandParameters;

  const getParameterExclusionGroups = (parameterKey: string): ExclusionGroup[] => {
    return exclusionGroups.filter((group) => group.parameterKeys.includes(parameterKey));
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          {isGlobal && <GlobeIcon className="h-5 w-5" />}
          {title} ({parameters.length})
        </h3>
        <Button
          onClick={() => setSelectedParameter(createNewParameter(isGlobal, selectedCommand?.key))}
          size="sm"
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {parameters.map((parameter) => {
          const paramGroups = getParameterExclusionGroups(parameter.key);

          return (
            <div
              key={parameter.key}
              className={"cursor-pointer rounded border border-muted p-3 hover:bg-muted/50"}
              onClick={() => setSelectedParameter(parameter)}
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
                    removeParameter(parameter.key);
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
                    key={group.key}
                    variant="secondary"
                    className="flex items-center gap-1 bg-muted text-xs"
                  >
                    <LayersIcon className="h-3 w-3" />
                    {group.name}
                  </Badge>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
