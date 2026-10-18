import { useToolBuilder } from "../tool-editor.context";
import { ExclusionGroup } from "@/components/commandly/types/tool";
import { getCommandParameters, getExclusionGroups } from "@/components/commandly/utils/tool";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusIcon, TrashIcon } from "lucide-react";
import { useState } from "react";

export function ExclusionGroupsDialog() {
  const {
    tool,
    selectedCommandKey,
    dialogs,
    setDialogOpen,
    addExclusionGroup,
    updateExclusionGroup,
    removeExclusionGroup,
  } = useToolBuilder();

  const open = dialogs.exclusionGroups;
  const exclusionGroups = getExclusionGroups(tool, selectedCommandKey);
  const parameters = getCommandParameters(tool, selectedCommandKey);

  const [editingGroup, setEditingGroup] = useState<Partial<ExclusionGroup> | undefined>();

  const handleAddGroup = () => {
    setEditingGroup({
      displayName: "",
      exclusionType: "mutual_exclusive",
      parameterKeys: [],
    });
  };

  const handleSaveGroup = () => {
    if (!editingGroup?.displayName || !editingGroup.exclusionType) return;

    if (editingGroup.key) {
      updateExclusionGroup(editingGroup as ExclusionGroup);
    } else {
      addExclusionGroup(editingGroup as Omit<ExclusionGroup, "key">);
    }
    setEditingGroup(undefined);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => setDialogOpen("exclusionGroups", open)}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Exclusion Groups</DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {exclusionGroups.map((group) => (
            <div
              key={group.key}
              className="flex items-center justify-between rounded border p-3"
            >
              <div>
                <h4 className="font-medium">{group.displayName}</h4>
                <div className="mt-1 flex gap-1">
                  {group.parameterKeys.map((key) => {
                    const param = parameters.find((p) => p.key === key);
                    return (
                      param && (
                        <span
                          key={key}
                          className="rounded bg-muted px-1.5 py-0.5 text-xs"
                        >
                          {param.displayName}
                        </span>
                      )
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingGroup(group)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (group.key) removeExclusionGroup(group.key);
                  }}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {!editingGroup && (
            <Button
              onClick={handleAddGroup}
              className="w-full"
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Group
            </Button>
          )}

          {editingGroup && (
            <div className="space-y-4 rounded border p-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editingGroup.displayName}
                  onChange={(e) =>
                    setEditingGroup({ ...editingGroup, displayName: e.target.value })
                  }
                  placeholder="Group name"
                />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={editingGroup.exclusionType}
                  onValueChange={(value) =>
                    setEditingGroup({
                      ...editingGroup,
                      exclusionType: value as ExclusionGroup["exclusionType"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mutual_exclusive">Mutually Exclusive</SelectItem>
                    <SelectItem value="required_one_of">Required One Of</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Parameters</Label>
                <Select
                  value=""
                  onValueChange={(value) =>
                    setEditingGroup({
                      ...editingGroup,
                      parameterKeys: [...(editingGroup.parameterKeys || []), value],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Add parameter" />
                  </SelectTrigger>
                  <SelectContent>
                    {parameters
                      .filter((p) => !editingGroup.parameterKeys?.includes(p.key))
                      .map((param) => (
                        <SelectItem
                          key={param.key}
                          value={param.key}
                        >
                          {param.displayName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                <div className="mt-2 flex flex-wrap gap-1">
                  {editingGroup.parameterKeys?.map((key) => {
                    const param = parameters.find((p) => p.key === key);
                    return (
                      param && (
                        <span
                          key={key}
                          className="flex items-center gap-1 rounded bg-muted px-2 py-1 text-sm"
                        >
                          {param.displayName}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0"
                            onClick={() =>
                              setEditingGroup({
                                ...editingGroup,
                                parameterKeys: editingGroup.parameterKeys?.filter(
                                  (pk) => pk !== key,
                                ),
                              })
                            }
                          >
                            <TrashIcon className="h-3 w-3" />
                          </Button>
                        </span>
                      )
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingGroup(undefined)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveGroup}>Save</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
