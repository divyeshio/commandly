import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  FileTextIcon,
  FlagIcon,
  HashIcon,
  LinkIcon,
  PlusIcon,
  ShieldIcon,
  Trash2Icon
} from "lucide-react";
import { useStore } from "@tanstack/react-store";
import { validateDefaultValue } from "@/registry/commandly/lib/utils/commandly";
import { v7 as uuidv7 } from "uuid";
import { toolBuilderActions, toolBuilderStore } from "../tool-editor.store";
import {
  Parameter,
  ParameterDataType,
  ParameterDependency,
  ParameterDependencyType,
  ParameterEnumValue,
  ParameterType,
  ParameterValidation,
  ParameterValidationType
} from "@/registry/commandly/lib/types/commandly";
import { TagsInput } from "@/registry/commandly/ui/tags-input";

export function ParameterDetailsDialog() {
  const selectedParameter = useStore(
    toolBuilderStore,
    (state) => state.selectedParameter
  );

  const commandId = useStore(
    toolBuilderStore,
    (state) => state.selectedCommand?.id
  );

  const availableParameters = useStore(toolBuilderStore, (state) => {
    if (!selectedParameter) return [];
    return state.tool.parameters.filter((p) => {
      if (p.id === selectedParameter.id) return false;
      if (selectedParameter.isGlobal) return p.isGlobal;
      return p.isGlobal || p.commandId === commandId;
    });
  });

  const [parameter, setParameter] = useState<Parameter>(selectedParameter!);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setParameter(selectedParameter!);
    setHasChanges(false);
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
    toolBuilderActions.setSelectedParameter(null);
    setHasChanges(false);
  };

  const handleSave = () => {
    if (parameter) {
      toolBuilderActions.upsertParameter(parameter);
      setHasChanges(false);
      handleClose();
    }
  };

  const updateParameter = (updates: Partial<Parameter>) => {
    setParameter((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const addDependency = () => {
    if (!parameter || availableParameters.length === 0) return;

    const newDependency: ParameterDependency = {
      id: uuidv7(),
      parameterId: parameter.id,
      dependsOnParameterId: availableParameters[0].id,
      dependencyType: "requires"
    };

    updateParameter({
      dependencies: [...(parameter.dependencies || []), newDependency]
    });
  };

  const updateDependency = (
    dependencyId: string,
    updates: Partial<ParameterDependency>
  ) => {
    if (!parameter) return;
    const updatedDependencies = parameter.dependencies?.map((dep) =>
      dep.id === dependencyId ? { ...dep, ...updates } : dep
    );
    updateParameter({ dependencies: updatedDependencies });
  };

  const removeDependency = (dependencyId: string) => {
    if (!parameter) return;
    const updatedDependencies = parameter.dependencies?.filter(
      (dep) => dep.id !== dependencyId
    );
    updateParameter({ dependencies: updatedDependencies });
  };

  const addValidation = () => {
    if (!parameter) return;
    const newValidation: ParameterValidation = {
      id: uuidv7(),
      parameterId: parameter.id,
      validationType: "min_length",
      validationValue: "1",
      errorMessage: "Value is too short"
    };

    updateParameter({
      validations: [...(parameter.validations || []), newValidation]
    });
  };

  const addEnumValue = () => {
    if (!parameter) return;
    const newEnumValue: ParameterEnumValue = {
      id: uuidv7(),
      parameterId: parameter.id,
      value: "new-value",
      displayName: "New Value",
      description: "",
      isDefault: false,
      sortOrder: 0
    };

    updateParameter({
      enumValues: [...parameter.enumValues, newEnumValue]
    });
  };

  if (!parameter) return null;

  const validation = validateDefaultValue(parameter);

  const canSaveChanges = () => {
    if (!hasChanges) return false;
    if (parameter.defaultValue && !validation.isValid) {
      return false;
    }

    if (!parameter.name.trim() || !parameter.longFlag.trim()) {
      return false;
    }
    if (
      availableParameters.some(
        (p) =>
          p.name.trim() === parameter.name.trim() ||
          parameter.longFlag == p.longFlag ||
          (parameter.shortFlag && parameter.shortFlag == p.shortFlag)
      )
    ) {
      return false;
    }

    return true;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getParameterIcon(parameter.parameterType)}
            {parameter.name}
            {parameter.isGlobal && (
              <Badge variant="default" className="text-xs">
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
                Parameter Name<span className="text-destructive ml-1">*</span>
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
                onValueChange={(value: ParameterType) =>
                  updateParameter({ parameterType: value })
                }
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
                onValueChange={(value: ParameterDataType) =>
                  updateParameter({ dataType: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="String">String</SelectItem>
                  <SelectItem value="Number">Number</SelectItem>
                  <SelectItem value="Boolean">Boolean</SelectItem>
                  <SelectItem value="Enum">Enum</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Switch
                id="isGlobal"
                checked={parameter.isGlobal}
                onCheckedChange={(checked) =>
                  updateParameter({ isGlobal: checked })
                }
              />
              <Label htmlFor="isGlobal">Global</Label>
            </div>
          </div>

          {(parameter.parameterType === "Flag" ||
            parameter.parameterType === "Option") && (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Short Flag (include prefix)</Label>
                <Input
                  value={parameter.shortFlag}
                  onChange={(e) =>
                    updateParameter({ shortFlag: e.target.value })
                  }
                  placeholder="-v"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>
                  Long Flag (include prefix){" "}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  value={parameter.longFlag}
                  onChange={(e) =>
                    updateParameter({ longFlag: e.target.value })
                  }
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
                onChange={(e) =>
                  updateParameter({ keyValueSeparator: e.target.value })
                }
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
                    position: Number.parseInt(e.target.value) || 0
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

          <div className="grid grid-cols-2 gap-4 items-center">
            <div className="flex flex-col gap-2">
              <Label htmlFor="defaultValue">Default Value</Label>
              <Input
                id="defaultValue"
                value={parameter.defaultValue}
                onChange={(e) =>
                  updateParameter({ defaultValue: e.target.value })
                }
                className={!validation.isValid ? "border-destructive" : ""}
              />
              {!validation.isValid && (
                <p className="text-xs text-destructive mt-1">
                  {validation.error}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4 pt-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isRequired"
                  checked={parameter.isRequired}
                  onCheckedChange={(checked) =>
                    updateParameter({ isRequired: checked })
                  }
                />
                <Label htmlFor="isRequired">Required</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isRepeatable"
                  checked={parameter.isRepeatable}
                  onCheckedChange={(checked) =>
                    updateParameter({ isRepeatable: checked })
                  }
                />
                <Label htmlFor="isRepeatable">Repeatable</Label>
              </div>
            </div>
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
            <div className="flex items-center justify-between mb-3">
              <Label
                htmlFor="dependencies"
                className="text-base font-medium flex items-center gap-2"
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
                <PlusIcon className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-2" id="dependencies">
              {parameter.dependencies &&
                parameter.dependencies.map((dependency) => (
                  <div
                    key={dependency.id}
                    className="flex items-center gap-2 p-2 border rounded"
                  >
                    <Select
                      value={dependency.dependencyType}
                      onValueChange={(value: ParameterDependencyType) =>
                        updateDependency(dependency.id, {
                          dependencyType: value
                        })
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="requires">Requires</SelectItem>
                        <SelectItem value="conflicts_with">
                          Conflicts
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={dependency.dependsOnParameterId}
                      onValueChange={(value) =>
                        updateDependency(dependency.id, {
                          dependsOnParameterId: value
                        })
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableParameters.map((param) => (
                          <SelectItem key={param.id} value={param.id}>
                            {param.name}
                            {param.isGlobal && " (global)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeDependency(dependency.id)}
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
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <ShieldIcon className="h-4 w-4" />
                Validations
              </Label>
              <Button size="sm" variant="outline" onClick={addValidation}>
                <PlusIcon className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {parameter.validations &&
                parameter.validations.map((validation) => (
                  <div
                    key={validation.id}
                    className="flex items-center gap-2 p-2 border rounded"
                  >
                    <Select
                      value={validation.validationType}
                      onValueChange={(value: ParameterValidationType) => {
                        const updatedValidations = parameter.validations?.map(
                          (v) =>
                            v.id === validation.id
                              ? { ...v, validationType: value }
                              : v
                        );
                        updateParameter({
                          validations: updatedValidations
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
                        const updatedValidations = parameter.validations?.map(
                          (v) =>
                            v.id === validation.id
                              ? { ...v, validationValue: e.target.value }
                              : v
                        );
                        updateParameter({
                          validations: updatedValidations
                        });
                      }}
                      placeholder="Value"
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const updatedValidations =
                          parameter.validations?.filter(
                            (v) => v.id !== validation.id
                          );
                        updateParameter({
                          validations: updatedValidations
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
                <div className="flex items-center justify-between mb-3">
                  <Label
                    htmlFor="enum-values"
                    className="text-base font-medium"
                  >
                    Enum Values
                  </Label>
                  <Button size="sm" variant="outline" onClick={addEnumValue}>
                    <PlusIcon className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2" id="enum-values">
                  {parameter.enumValues.map((enumValue) => (
                    <div
                      key={enumValue.id}
                      className="flex items-center gap-2 p-2 border rounded"
                    >
                      <Input
                        value={enumValue.value}
                        onChange={(e) => {
                          const updatedEnumValues = parameter.enumValues.map(
                            (ev) =>
                              ev.id === enumValue.id
                                ? { ...ev, value: e.target.value }
                                : ev
                          );
                          updateParameter({
                            enumValues: updatedEnumValues
                          });
                        }}
                        placeholder="value"
                        className="flex-1"
                      />
                      <Input
                        value={enumValue.displayName}
                        onChange={(e) => {
                          const updatedEnumValues = parameter.enumValues.map(
                            (ev) =>
                              ev.id === enumValue.id
                                ? { ...ev, displayName: e.target.value }
                                : ev
                          );
                          updateParameter({
                            enumValues: updatedEnumValues
                          });
                        }}
                        placeholder="Display Name"
                        className="flex-1"
                      />
                      <Switch
                        checked={enumValue.isDefault}
                        onCheckedChange={(checked) => {
                          const updatedEnumValues = parameter.enumValues.map(
                            (ev) =>
                              ev.id === enumValue.id
                                ? { ...ev, isDefault: checked }
                                : ev
                          );
                          updateParameter({
                            enumValues: updatedEnumValues
                          });
                        }}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const updatedEnumValues = parameter.enumValues.filter(
                            (ev) => ev.id !== enumValue.id
                          );
                          updateParameter({
                            enumValues: updatedEnumValues
                          });
                        }}
                      >
                        <Trash2Icon className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSaveChanges()}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
