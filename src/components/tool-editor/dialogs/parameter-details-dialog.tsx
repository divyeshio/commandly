import { useToolBuilder } from "../tool-editor.context";
import {
  Parameter,
  ParameterDataType,
  ParameterDependency,
  ParameterDependencyType,
  ParameterEnumValue,
  ParameterEnumValues,
  ParameterType,
  ParameterValidation,
  ParameterValidationType,
} from "@/components/commandly/types/tool";
import { TagsInput } from "@/components/commandly/ui/tags-input";
import { getCommandParameters, slugify } from "@/components/commandly/utils/tool";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from "@/components/ui/sortable";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  FlagIcon,
  FileTextIcon,
  GripVerticalIcon,
  HashIcon,
  LinkIcon,
  PlusIcon,
  ShieldIcon,
  Trash2Icon,
} from "lucide-react";
import { useRef, useState } from "react";

const DATA_TYPE_OPTIONS: Record<ParameterType, ParameterDataType[]> = {
  Flag: ["Boolean"],
  Option: ["String", "Number", "Boolean", "Enum"],
  Argument: ["String", "Number", "Boolean", "Enum"],
};

interface ParameterDetailsDialogProps {
  parameter?: Parameter;
  onSave: (parameter: Parameter) => void;
}

export function ParameterDetailsDialog({ parameter, onSave }: ParameterDetailsDialogProps) {
  const { selectedCommandKey, tool, setSelectedParameter } = useToolBuilder();

  const isRootParameter = selectedCommandKey === null;
  const isNewParameter = !parameter;

  const [internalParameter, setParameter] = useState<Parameter>(
    () =>
      parameter ?? {
        key: "",
        displayName: "",
        parameterType: "Option" as ParameterType,
        dataType: "String" as ParameterDataType,
        aliases: [],
      },
  );
  const [hasChanges, setHasChanges] = useState(false);
  const enumValueIdsRef = useRef<string[]>(
    (parameter?.enum?.values ?? []).map(() => Math.random().toString(36).slice(2, 9)),
  );

  const siblingParameters = getCommandParameters(tool, selectedCommandKey);

  const availableParameters = siblingParameters.filter(
    (p) => !parameter || p.key !== parameter.key,
  );

  const getParameterIcon = (parameterType: string) => {
    switch (parameterType) {
      case "Flag":
        return <FlagIcon className="h-5 w-5" />;
      case "Option":
        return <HashIcon className="h-5 w-5" />;
      case "Argument":
        return <FileTextIcon className="h-5 w-5" />;
      default:
        return <HashIcon className="h-5 w-5" />;
    }
  };

  const handleClose = () => {
    setSelectedParameter(null);
    setHasChanges(false);
  };

  const handleSave = () => {
    onSave(internalParameter);
  };

  const updateParameter = (updates: Partial<Parameter>) => {
    setParameter((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const addDependency = () => {
    if (!parameter || availableParameters.length === 0) return;

    const dependsOnParameterKey = availableParameters[0].key;
    const newDependency: ParameterDependency = {
      key: slugify(`${parameter.key}-${dependsOnParameterKey}`),
      parameterKey: parameter.key,
      dependsOnParameterKey,
      dependencyType: "requires",
    };

    updateParameter({
      dependencies: [...(parameter.dependencies || []), newDependency],
    });
  };

  const updateDependency = (dependencyKey: string, updates: Partial<ParameterDependency>) => {
    const updatedDependencies = internalParameter.dependencies?.map((dep) =>
      dep.key === dependencyKey ? { ...dep, ...updates } : dep,
    );
    updateParameter({ dependencies: updatedDependencies });
  };

  const removeDependency = (dependencyKey: string) => {
    const updatedDependencies = internalParameter.dependencies?.filter(
      (dep) => dep.key !== dependencyKey,
    );
    updateParameter({ dependencies: updatedDependencies });
  };

  const addValidation = () => {
    if (!parameter) return;
    const validationType = "min_length";
    const validationValue = "1";
    const newValidation: ParameterValidation = {
      key: slugify(`${parameter.key}-${validationType}-${validationValue}`),
      validationType,
      validationValue,
      errorMessage: "Value is too short",
    };

    updateParameter({
      validations: [...(parameter.validations || []), newValidation],
    });
  };

  const addEnumValue = () => {
    if (!parameter) return;
    const newEnumValue: ParameterEnumValue = {
      value: "",
      displayName: "",
      isDefault: false,
      sortOrder: parameter.enum?.values?.length ?? 0,
    };
    enumValueIdsRef.current = [...enumValueIdsRef.current, Math.random().toString(36).slice(2, 9)];
    const existing = parameter.enum ?? { values: [], allowMultiple: false };
    updateParameter({
      enum: { ...existing, values: [...existing.values, newEnumValue] },
    });
  };

  const canSaveChanges = () => {
    if (!hasChanges) return false;

    const aliases = (internalParameter.aliases ?? []).filter((alias) => alias.trim());

    if (!internalParameter.displayName.trim()) {
      return false;
    }
    if (!internalParameter.key.trim()) {
      return false;
    }
    const siblingKeys = new Set(availableParameters.map((sibling) => sibling.key));
    const siblingAliases = new Set(availableParameters.flatMap((sibling) => sibling.aliases ?? []));
    const clashes =
      [internalParameter.key, ...aliases].some(
        (form) => siblingKeys.has(form) || siblingAliases.has(form),
      ) ||
      availableParameters.some(
        (sibling) => sibling.displayName.trim() === internalParameter.displayName.trim(),
      );
    if (clashes) {
      return false;
    }

    if (internalParameter.dataType === "Enum") {
      if (!internalParameter.enum?.values?.length) return false;
      if (internalParameter.enum.values.some((v) => !v.value.trim())) return false;
    }

    return true;
  };

  return (
    <Dialog
      open={true}
      onOpenChange={handleClose}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getParameterIcon(internalParameter.parameterType)}
            {internalParameter.displayName}
            {isRootParameter && (
              <Badge
                variant="default"
                className="text-xs"
              >
                root
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="param-display-name">
                Display Name<span className="ml-1 text-destructive">*</span>
              </Label>
              <Input
                id="param-display-name"
                value={internalParameter.displayName}
                onChange={(e) => updateParameter({ displayName: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="param-key">
                Key<span className="ml-1 text-destructive">*</span>
              </Label>
              <Input
                id="param-key"
                value={internalParameter.key}
                onChange={(e) => updateParameter({ key: e.target.value })}
                placeholder="--output"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Parameter Type</Label>
              <Select
                value={internalParameter.parameterType}
                onValueChange={(value) => {
                  const parameterType = value as ParameterType;
                  if (parameterType === "Flag") {
                    updateParameter({ parameterType, dataType: "Boolean" });
                  } else {
                    updateParameter({
                      parameterType,
                      ...(internalParameter.parameterType === "Flag" ? { dataType: "String" } : {}),
                    });
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Flag">Flag</SelectItem>
                  <SelectItem value="Option">Option</SelectItem>
                  <SelectItem value="Argument">Argument</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Data Type</Label>
              <Select
                value={internalParameter.dataType}
                onValueChange={(value) => updateParameter({ dataType: value as ParameterDataType })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATA_TYPE_OPTIONS[internalParameter.parameterType].map((dataType) => (
                    <SelectItem
                      key={dataType}
                      value={dataType}
                    >
                      {dataType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Switch
                id="recursive"
                checked={internalParameter.recursive ?? false}
                onCheckedChange={(checked) => updateParameter({ recursive: checked })}
              />
              <Label htmlFor="recursive">Inherited by subcommands</Label>
            </div>
          </div>

          {(internalParameter.parameterType === "Flag" ||
            internalParameter.parameterType === "Option") && (
            <div className="flex flex-col gap-2">
              <Label>Short names and other aliases</Label>
              <TagsInput
                value={internalParameter.aliases ?? []}
                onValueChange={(aliases) => updateParameter({ aliases })}
                placeholder="Add short names, e.g. -o"
              />
            </div>
          )}

          {internalParameter.parameterType === "Option" && (
            <div className="flex flex-col gap-2">
              <Label>
                Key-Value Separator
                <span className="muted">(default is single space)</span>
              </Label>
              <Input
                value={internalParameter.keyValueSeparator ?? " "}
                onChange={(e) => updateParameter({ keyValueSeparator: e.target.value })}
                placeholder="Default is single space"
              />
            </div>
          )}

          {internalParameter.parameterType === "Argument" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                type="number"
                value={internalParameter.position || 0}
                onChange={(e) =>
                  updateParameter({
                    position: Number.parseInt(e.target.value) || 0,
                  })
                }
                placeholder="0"
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label>Description</Label>
            <Textarea
              value={internalParameter.description}
              onChange={(e) => updateParameter({ description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Group</Label>
            <Input
              value={internalParameter.group ?? ""}
              onChange={(e) => updateParameter({ group: e.target.value || undefined })}
              placeholder="e.g. output"
            />
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="isRequired"
                checked={internalParameter.isRequired}
                onCheckedChange={(checked) => updateParameter({ isRequired: checked })}
              />
              <Label htmlFor="isRequired">Required</Label>
            </div>
            {internalParameter.parameterType !== "Flag" && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="isRepeatable"
                  checked={internalParameter.isRepeatable}
                  onCheckedChange={(checked) => updateParameter({ isRepeatable: checked })}
                />
                <Label htmlFor="isRepeatable">Repeatable</Label>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Tags</Label>
            <TagsInput
              value={internalParameter.metadata?.tags || []}
              onValueChange={(tags) => {
                updateParameter({ metadata: { tags } });
              }}
              placeholder="Add tags"
            />
          </div>

          <Separator />

          {/* Dependencies Section */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <Label
                htmlFor="dependencies"
                className="flex items-center gap-2 text-base font-medium"
              >
                <LinkIcon className="h-4 w-4" />
                Dependencies
              </Label>
              <Button
                size="sm"
                variant="outline"
                onClick={addDependency}
                disabled={availableParameters.length === 0}
              >
                <PlusIcon className="mr-1 h-3 w-3" />
                Add
              </Button>
            </div>
            <div
              className="space-y-2"
              id="dependencies"
            >
              {internalParameter.dependencies &&
                internalParameter.dependencies.map((dependency) => (
                  <div
                    key={dependency.key}
                    className="flex items-center gap-2 rounded border p-2"
                  >
                    <Select
                      value={dependency.dependencyType}
                      onValueChange={(value) =>
                        updateDependency(dependency.key, {
                          dependencyType: value as ParameterDependencyType,
                        })
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="requires">Requires</SelectItem>
                        <SelectItem value="conflicts_with">Conflicts</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={dependency.dependsOnParameterKey}
                      onValueChange={(value) =>
                        updateDependency(dependency.key, {
                          dependsOnParameterKey: value,
                        })
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableParameters.map((param) => (
                          <SelectItem
                            key={param.key}
                            value={param.key}
                          >
                            {param.displayName}
                            {param.recursive && " (inherited)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeDependency(dependency.key)}
                    >
                      <Trash2Icon className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
            </div>
          </div>

          <Separator />

          {/* Validations Section */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <Label className="flex items-center gap-2 text-base font-medium">
                <ShieldIcon className="h-4 w-4" />
                Validations
              </Label>
              <Button
                size="sm"
                variant="outline"
                onClick={addValidation}
              >
                <PlusIcon className="mr-1 h-3 w-3" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {internalParameter.validations &&
                internalParameter.validations.map((validation) => (
                  <div
                    key={validation.key}
                    className="flex items-center gap-2 rounded border p-2"
                  >
                    <Select
                      value={validation.validationType}
                      onValueChange={(value) => {
                        const validationType = value as ParameterValidationType;
                        const updatedValidations = internalParameter.validations?.map((v) =>
                          v.key === validation.key ? { ...v, validationType } : v,
                        );
                        updateParameter({
                          validations: updatedValidations,
                        });
                      }}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="min_length">Min Length</SelectItem>
                        <SelectItem value="max_length">Max Length</SelectItem>
                        <SelectItem value="min_value">Min Value</SelectItem>
                        <SelectItem value="max_value">Max Value</SelectItem>
                        <SelectItem value="regex">Regex</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={validation.validationValue}
                      onChange={(e) => {
                        const updatedValidations = internalParameter.validations?.map((v) =>
                          v.key === validation.key ? { ...v, validationValue: e.target.value } : v,
                        );
                        updateParameter({
                          validations: updatedValidations,
                        });
                      }}
                      placeholder="Value"
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const updatedValidations = internalParameter.validations?.filter(
                          (v) => v.key !== validation.key,
                        );
                        updateParameter({
                          validations: updatedValidations,
                        });
                      }}
                    >
                      <Trash2Icon className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
            </div>
          </div>

          {/* Enum Values Section */}
          {internalParameter.dataType === "Enum" && (
            <>
              <Separator />
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <Label
                    htmlFor="enum-values"
                    className="text-base font-medium"
                  >
                    Enum Values
                  </Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addEnumValue}
                  >
                    <PlusIcon className="mr-1 h-3 w-3" />
                    Add
                  </Button>
                </div>
                <div className="mb-3 flex items-center gap-4">
                  <div className="flex h-8 items-center space-x-2">
                    <Switch
                      id="allow-multiple"
                      checked={internalParameter.enum?.allowMultiple ?? false}
                      onCheckedChange={(checked) =>
                        updateParameter({
                          enum: {
                            ...(internalParameter.enum ?? { values: [] }),
                            allowMultiple: checked,
                          } as ParameterEnumValues,
                        })
                      }
                    />
                    <Label htmlFor="allow-multiple">Allow Multiple</Label>
                  </div>
                  {internalParameter.enum?.allowMultiple && (
                    <div className="flex gap-2">
                      <Label>Separator</Label>
                      <Input
                        value={internalParameter.enum?.separator ?? ","}
                        onChange={(e) =>
                          updateParameter({
                            enum: {
                              ...(internalParameter.enum ?? { values: [], allowMultiple: true }),
                              separator: e.target.value,
                            },
                          })
                        }
                        placeholder="e.g. ,"
                        className="w-20"
                      />
                    </div>
                  )}
                </div>
                {internalParameter.enum?.values && internalParameter.enum.values.length > 0 && (
                  <div className="mb-1 flex items-center gap-2 border border-transparent px-2">
                    <div className="size-7 shrink-0" />
                    <span className="flex-1 text-xs text-muted-foreground">Value</span>
                    <span className="flex-1 text-xs text-muted-foreground">Display Name</span>
                    <div className="invisible flex shrink-0 items-center gap-1">
                      <div className="h-[1.15rem] w-8" />
                      <span className="text-xs">Default</span>
                    </div>
                    <div className="size-7 shrink-0" />
                  </div>
                )}
                <Sortable
                  value={enumValueIdsRef.current}
                  onValueChange={(newOrder) => {
                    const idToIndex = Object.fromEntries(
                      enumValueIdsRef.current.map((id, i) => [id, i]),
                    );
                    const reorderedValues = (newOrder as string[]).map((id, newIndex) => ({
                      ...internalParameter.enum!.values[idToIndex[id]],
                      sortOrder: newIndex,
                    }));
                    enumValueIdsRef.current = newOrder as string[];
                    updateParameter({
                      enum: { ...internalParameter.enum!, values: reorderedValues },
                    });
                  }}
                >
                  <SortableContent
                    className="space-y-2"
                    id="enum-values"
                  >
                    {internalParameter.enum?.values?.map((enumValue, index) => (
                      <SortableItem
                        key={enumValueIdsRef.current[index]}
                        value={enumValueIdsRef.current[index]}
                        className="flex items-center gap-2 rounded border p-2"
                      >
                        <SortableItemHandle className="shrink-0 text-muted-foreground">
                          <GripVerticalIcon className="h-4 w-4" />
                        </SortableItemHandle>
                        <Input
                          value={enumValue.value}
                          onChange={(e) => {
                            const updatedValues = internalParameter.enum?.values?.map((ev) =>
                              ev === enumValue ? { ...ev, value: e.target.value } : ev,
                            );
                            updateParameter({
                              enum: {
                                ...(internalParameter.enum ?? { allowMultiple: false }),
                                values: updatedValues ?? [],
                              },
                            });
                          }}
                          placeholder="value"
                          className="flex-1"
                        />
                        <Input
                          value={enumValue.displayName}
                          onChange={(e) => {
                            const updatedValues = internalParameter.enum?.values?.map((ev) =>
                              ev === enumValue ? { ...ev, displayName: e.target.value } : ev,
                            );
                            updateParameter({
                              enum: {
                                ...(internalParameter.enum ?? { allowMultiple: false }),
                                values: updatedValues ?? [],
                              },
                            });
                          }}
                          placeholder="Display Name"
                          className="flex-1"
                        />
                        <div className="flex shrink-0 items-center gap-1">
                          <Switch
                            checked={enumValue.isDefault}
                            onCheckedChange={(checked) => {
                              const updatedValues = internalParameter.enum?.values?.map((ev) =>
                                ev === enumValue
                                  ? { ...ev, isDefault: checked }
                                  : checked
                                    ? { ...ev, isDefault: false }
                                    : ev,
                              );
                              updateParameter({
                                enum: {
                                  ...(internalParameter.enum ?? { allowMultiple: false }),
                                  values: updatedValues ?? [],
                                },
                              });
                            }}
                          />
                          <Label className="text-xs">Default</Label>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="size-7 shrink-0 p-0"
                          onClick={() => {
                            const updatedValues = internalParameter.enum?.values?.filter(
                              (_, valueIndex) => valueIndex !== index,
                            );
                            enumValueIdsRef.current = enumValueIdsRef.current.filter(
                              (_, i) => i !== index,
                            );
                            updateParameter({
                              enum: {
                                ...(internalParameter.enum ?? { allowMultiple: false }),
                                values: updatedValues ?? [],
                              },
                            });
                          }}
                        >
                          <Trash2Icon className="h-3 w-3" />
                        </Button>
                      </SortableItem>
                    ))}
                  </SortableContent>
                  <SortableOverlay />
                </Sortable>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSaveChanges()}
          >
            {isNewParameter ? "Add" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
