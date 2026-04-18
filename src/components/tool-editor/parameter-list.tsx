import { useToolBuilder } from "./tool-editor.context";
import { ExclusionGroup, ParameterType } from "@/components/commandly/types/flat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from "@/components/ui/sortable";
import { cn } from "@/lib/utils";
import {
  Edit2Icon,
  FileTextIcon,
  FlagIcon,
  GlobeIcon,
  GripVerticalIcon,
  HashIcon,
  LayersIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useRef } from "react";

interface ParameterListProps {
  title: string;
  isGlobal?: boolean;
  isChatOpen?: boolean;
  pendingChanges?: { updated: Set<string>; added: Set<string>; removed: Set<string> };
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

export function ParameterList({
  title,
  isGlobal = false,
  isChatOpen = false,
  pendingChanges,
}: ParameterListProps) {
  const {
    selectedCommand,
    contextSelection,
    getGlobalParameters,
    getRootParameters,
    getParametersForCommand,
    getExclusionGroupsForCommand,
    setSelectedParameter,
    setContextSelection,
    removeParameter,
    reorderParameters,
  } = useToolBuilder();

  const lastSelectedIndexRef = useRef<number | null>(null);

  const globalParameters = getGlobalParameters();
  const rootParameters = getRootParameters();
  const commandParameters = selectedCommand?.key
    ? getParametersForCommand(selectedCommand.key)
    : [];
  const exclusionGroups = selectedCommand?.key
    ? getExclusionGroupsForCommand(selectedCommand.key)
    : [];

  const parameters = isGlobal
    ? globalParameters
    : selectedCommand
      ? commandParameters
      : rootParameters;

  const removedParameters = isGlobal
    ? pendingChanges
      ? [...pendingChanges.removed].filter((k) => !parameters.some((p) => p.key === k))
      : []
    : pendingChanges
      ? [...pendingChanges.removed].filter(
          (k) => !parameters.some((p) => p.key === k) && !globalParameters.some((p) => p.key === k),
        )
      : [];

  const getParameterExclusionGroups = (parameterKey: string): ExclusionGroup[] => {
    return exclusionGroups.filter((group) => group.parameterKeys.includes(parameterKey));
  };

  const handleParameterClick = (e: React.MouseEvent, paramKey: string, index: number) => {
    e.stopPropagation();

    if (e.ctrlKey || e.metaKey) {
      const already = contextSelection.parameterKeys.includes(paramKey);
      setContextSelection({
        ...contextSelection,
        parameterKeys: already
          ? contextSelection.parameterKeys.filter((k) => k !== paramKey)
          : [...contextSelection.parameterKeys, paramKey],
      });
      lastSelectedIndexRef.current = index;
    } else if (e.shiftKey) {
      const anchor = lastSelectedIndexRef.current ?? index;
      const from = Math.min(anchor, index);
      const to = Math.max(anchor, index);
      const rangeKeys = parameters.slice(from, to + 1).map((p) => p.key);
      const merged = Array.from(new Set([...contextSelection.parameterKeys, ...rangeKeys]));
      setContextSelection({ ...contextSelection, parameterKeys: merged });
    } else {
      setContextSelection({ commandKeys: [], parameterKeys: [paramKey] });
      lastSelectedIndexRef.current = index;
    }
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
            setSelectedParameter({
              key: "",
              name: "",
              parameterType: "Option",
              dataType: "String",
              ...(isGlobal ? { isGlobal: true as const } : { commandKey: selectedCommand?.key }),
            })
          }
          size="sm"
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>

      <Sortable
        value={parameters}
        getItemValue={(p) => p.key}
        onValueChange={(newOrder) => reorderParameters(newOrder.map((p) => p.key))}
      >
        <SortableContent className="space-y-2">
          {parameters.map((parameter, index) => {
            const paramGroups = getParameterExclusionGroups(parameter.key);
            const isContextSelected = contextSelection.parameterKeys.includes(parameter.key);
            const isAdded = pendingChanges?.added.has(parameter.key);
            const isUpdated = pendingChanges?.updated.has(parameter.key);

            return (
              <SortableItem
                key={parameter.key}
                value={parameter.key}
                asChild
              >
                <div
                  className={cn(
                    "group cursor-pointer rounded border p-3 hover:bg-muted/50",
                    isAdded && "border-l-2 border-l-green-500",
                    isUpdated && "border-l-2 border-l-amber-500",
                    !isAdded && !isUpdated && isChatOpen && isContextSelected
                      ? "border-primary bg-accent/30 ring-1 ring-primary"
                      : !isAdded && !isUpdated
                        ? "border-muted"
                        : "",
                  )}
                  onClick={(e) => handleParameterClick(e, parameter.key, index)}
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
                    <div className="flex items-center gap-0.5">
                      <SortableItemHandle asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <GripVerticalIcon className="h-3 w-3" />
                        </Button>
                      </SortableItemHandle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedParameter(parameter);
                        }}
                      >
                        <Edit2Icon className="h-3 w-3" />
                      </Button>
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
                    {isAdded && (
                      <Badge
                        variant="outline"
                        className="border-green-500/40 bg-green-500/10 text-xs text-green-600 dark:text-green-400"
                      >
                        Added
                      </Badge>
                    )}
                    {isUpdated && (
                      <Badge
                        variant="outline"
                        className="border-amber-500/40 bg-amber-500/10 text-xs text-amber-600 dark:text-amber-400"
                      >
                        Updated
                      </Badge>
                    )}
                  </div>
                </div>
              </SortableItem>
            );
          })}
        </SortableContent>
        <SortableOverlay>
          {({ value }) => {
            const param = parameters.find((p) => p.key === value);
            return (
              <div className="rounded border bg-background p-3 text-sm font-medium">
                {param?.name}
              </div>
            );
          }}
        </SortableOverlay>
      </Sortable>
      {removedParameters.map((key) => (
        <div
          key={key}
          className="rounded border border-l-2 border-muted border-l-red-500 p-3 opacity-60"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground line-through">{key}</span>
            <Badge
              variant="outline"
              className="border-red-500/40 bg-red-500/10 text-xs text-red-600 dark:text-red-400"
            >
              Removed
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
