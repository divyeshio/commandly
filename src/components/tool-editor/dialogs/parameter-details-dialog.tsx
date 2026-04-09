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
} from "@/components/commandly/types/flat";
import { TagsInput } from "@/components/commandly/ui/tags-input";
import { slugify } from "@/components/commandly/utils/flat";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from "@/components/ui/sortable";
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
import { useEffect, useRef, useState } from "react";

const DATA_TYPE_OPTIONS: Record<ParameterType, ParameterDataType[]> = {
  Flag: ["Boolean"],
  Option: ["String", "Number", "Boolean", "Enum"],
  Argument: ["String", "Number", "Boolean", "Enum"],
};

export function ParameterDetailsDialog() {
  const { selectedParameter, selectedCommand, tool, setSelectedParameter, upsertParameter } =
    useToolBuilder();

  const commandKey = selectedCommand?.key;

  const availableParameters = selectedParameter
    ? tool.parameters.filter((p) => {
        if (p.key === selectedParameter.key) return false;
        if (selectedParameter.isGlobal) return p.isGlobal;
        return p.isGlobal || p.commandKey === commandKey;
      })
    : [];

  const isNewParameter = !tool.parameters.some((p) => p.key === selectedParameter?.key);

  const [parameter, setParameter] = useState<Parameter>(selectedParameter!);
  const [hasChanges, setHasChanges] = useState(false);
  const enumValueIdsRef = useRef<string[]>([]);

  useEffect(() => {
    setParameter(selectedParameter!);
    setHasChanges(false);
    enumValueIdsRef.current = (selectedParameter?.enum?.values ?? []).map(() =>
      Math.random().toString(36).slice(2, 9),
    );
  }, [selectedParameter]);

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

  const isOpen = !!selectedParameter;

  const handleClose = () => {
    setSelectedParameter(null);
    setHasChanges(false);
  };

  const handleSave = () => {
    if (parameter) {
      upsertParameter(parameter);
      setHasChanges(false);
      handleClose();
    }
  };

  const updateParameter = (updates: Partial<Parameter>) => {
    setParameter((prev) => {
      const next = { ...prev, ...updates };
      if (updates.name || updates.longFlag) {
        let generatedKey = slugify(next.longFlag || next.name);

        const existingParam = tool.parameters.find(
          (p) => p.key === generatedKey && p.key !== selectedParameter?.key,
        );
        // If duplicate exists and parameter is not global, prefix with command key
        if (existingParam && !next.isGlobal && commandKey) {
          generatedKey = `${commandKey}-${generatedKey}`;
        }

        next.key = generatedKey;
      }
      return next;
    });
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
    if (!parameter) return;
    const updatedDependencies = parameter.dependencies?.map((dep) =>
      dep.key === dependencyKey ? { ...dep, ...updates } : dep,
    );
    updateParameter({ dependencies: updatedDependencies });
  };

  const removeDependency = (dependencyKey: string) => {
    if (!parameter) return;
    const updatedDependencies = parameter.dependencies?.filter((dep) => dep.key !== dependencyKey);
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

  if (!parameter) return null;

  const canSaveChanges = () => {
    if (!hasChanges) return false;

    if (!parameter.name.trim() || !parameter.longFlag?.trim()) {
      return false;
    }
    if (
      availableParameters.some(
        (p) =>
          p.name.trim() === parameter.name.trim() ||
          parameter.longFlag == p.longFlag ||
          (parameter.shortFlag && parameter.shortFlag == p.shortFlag),
      )
    ) {
      return false;
    }

    if (parameter.dataType === "Enum") {
      if (!parameter.enum?.values?.length) return false;
      if (parameter.enum.values.some((v) => !v.value.trim())) return false;
    }

    return true;
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={handleClose}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getParameterIcon(parameter.parameterType)}
            {parameter.name}
            {parameter.isGlobal && (
              <Badge
                variant="default"
                className="text-xs"
              >
                global
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>
                Parameter Name<span className="ml-1 text-destructive">*</span>
              </Label>
              <Input
                value={parameter.name}
                onChange={(e) => updateParameter({ name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Parameter Type</Label>
              <Select
                value={parameter.parameterType}
                onValueChange={(value: ParameterType) => {
                  if (value === "Flag") {
                    updateParameter({ parameterType: value, dataType: "Boolean" });
                  } else {
                    updateParameter({
                      parameterType: value,
                      ...(parameter.parameterType === "Flag" ? { dataType: "String" } : {}),
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
                value={parameter.dataType}
                onValueChange={(value: ParameterDataType) => updateParameter({ dataType: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATA_TYPE_OPTIONS[parameter.parameterType].map((dataType) => (
                    <SelectItem key={dataType} value={dataType}>
                      {dataType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Switch
                id="isGlobal"
                checked={parameter.isGlobal}
                onCheckedChange={(checked) => updateParameter({ isGlobal: checked })}
              />
              <Label htmlFor="isGlobal">Global</Label>
            </div>
          </div>

          {(parameter.parameterType === "Flag" || parameter.parameterType === "Option") && (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Short Flag (include prefix)</Label>
                <Input
                  value={parameter.shortFlag}
                  onChange={(e) => updateParameter({ shortFlag: e.target.value })}
                  placeholder="-v"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>
                  Long Flag (include prefix) <span className="ml-1 text-destructive">*</span>
                </Label>
                <Input
                  value={parameter.longFlag}
                  onChange={(e) => updateParameter({ longFlag: e.target.value })}
                  placeholder="--verbose"
                />
              </div>
            </div>
          )}

          {parameter.parameterType === "Option" && (
            <div className="flex flex-col gap-2">
              <Label>
                Key-Value Separator
                <span className="muted">(default is single space)</span>
              </Label>
              <Input
                value={parameter.keyValueSeparator ?? " "}
                onChange={(e) => updateParameter({ keyValueSeparator: e.target.value })}
                placeholder="Default is single space"
              />
            </div>
          )}

          {parameter.parameterType === "Argument" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                type="number"
                value={parameter.position || 0}
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
              value={parameter.description}
              onChange={(e) => updateParameter({ description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Group</Label>
            <Input
              value={parameter.group ?? ""}
              onChange={(e) => updateParameter({ group: e.target.value || undefined })}
              placeholder="e.g. output"
            />
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="isRequired"
                checked={parameter.isRequired}
                onCheckedChange={(checked) => updateParameter({ isRequired: checked })}
              />
              <Label htmlFor="isRequired">Required</Label>
            </div>
            {parameter.parameterType !== "Flag" && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="isRepeatable"
                  checked={parameter.isRepeatable}
                  onCheckedChange={(checked) => updateParameter({ isRepeatable: checked })}
                />
                <Label htmlFor="isRepeatable">Repeatable</Label>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Tags</Label>
            <TagsInput
              value={parameter.metadata?.tags || []}
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
              {parameter.dependencies &&
                parameter.dependencies.map((dependency) => (
                  <div
                    key={dependency.key}
                    className="flex items-center gap-2 rounded border p-2"
                  >
                    <Select
                      value={dependency.dependencyType}
                      onValueChange={(value: ParameterDependencyType) =>
                        updateDependency(dependency.key, {
                          dependencyType: value,
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
                            {param.name}
                            {param.isGlobal && " (global)"}
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
              {parameter.validations &&
                parameter.validations.map((validation) => (
                  <div
                    key={validation.key}
                    className="flex items-center gap-2 rounded border p-2"
                  >
                    <Select
                      value={validation.validationType}
                      onValueChange={(value: ParameterValidationType) => {
                        const updatedValidations = parameter.validations?.map((v) =>
                          v.key === validation.key ? { ...v, validationType: value } : v,
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
                        const updatedValidations = parameter.validations?.map((v) =>
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
                        const updatedValidations = parameter.validations?.filter(
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
          {parameter.dataType === "Enum" && (
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
                  <div className="flex items-center space-x-2 h-8">
                    <Switch
                      id="allow-multiple"
                      checked={parameter.enum?.allowMultiple ?? false}
                      onCheckedChange={(checked) =>
                        updateParameter({
                          enum: {
                            ...(parameter.enum ?? { values: [] }),
                            allowMultiple: checked,
                          } as ParameterEnumValues,
                        })
                      }
                    />
                    <Label htmlFor="allow-multiple">Allow Multiple</Label>
                  </div>
                  {parameter.enum?.allowMultiple && (
                    <div className="flex gap-2">
                      <Label>Separator</Label>
                      <Input
                        value={parameter.enum?.separator ?? ","}
                        onChange={(e) =>
                          updateParameter({
                            enum: {
                              ...(parameter.enum ?? { values: [], allowMultiple: true }),
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
                {parameter.enum?.values && parameter.enum.values.length > 0 && (
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
                      ...parameter.enum!.values[idToIndex[id]],
                      sortOrder: newIndex,
                    }));
                    enumValueIdsRef.current = newOrder as string[];
                    updateParameter({
                      enum: { ...parameter.enum!, values: reorderedValues },
                    });
                  }}
                >
                  <SortableContent
                    className="space-y-2"
                    id="enum-values"
                  >
                  {parameter.enum?.values?.map((enumValue, index) => (
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
                          const updatedValues = parameter.enum?.values?.map((ev) =>
                            ev === enumValue ? { ...ev, value: e.target.value } : ev,
                          );
                          updateParameter({
                            enum: {
                              ...(parameter.enum ?? { allowMultiple: false }),
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
                          const updatedValues = parameter.enum?.values?.map((ev) =>
                            ev === enumValue
                              ? { ...ev, displayName: e.target.value }
                              : ev,
                          );
                          updateParameter({
                            enum: {
                              ...(parameter.enum ?? { allowMultiple: false }),
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
                            const updatedValues = parameter.enum?.values?.map((ev) =>
                              ev === enumValue
                                ? { ...ev, isDefault: checked }
                                : checked
                                  ? { ...ev, isDefault: false }
                                  : ev,
                            );
                            updateParameter({
                              enum: {
                                ...(parameter.enum ?? { allowMultiple: false }),
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
                          const updatedValues = parameter.enum?.values?.filter(
                            (_, valueIndex) => valueIndex !== index,
                          );
                          enumValueIdsRef.current = enumValueIdsRef.current.filter(
                            (_, i) => i !== index,
                          );
                          updateParameter({
                            enum: {
                              ...(parameter.enum ?? { allowMultiple: false }),
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
