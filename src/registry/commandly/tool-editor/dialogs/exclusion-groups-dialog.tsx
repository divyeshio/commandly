import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ExclusionGroup } from "@/registry/commandly/lib/types/tool-editor";
import { PlusIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { useStore } from "@tanstack/react-store";
import {
  toolBuilderStore,
  toolBuilderActions,
  toolBuilderSelectors
} from "../tool-editor.store";

export function ExclusionGroupsDialog() {
  const selectedCommand = useStore(
    toolBuilderStore,
    (state) => state.selectedCommand
  );
  const open = useStore(
    toolBuilderStore,
    (state) => state.dialogs.exclusionGroups
  );

  const exclusionGroups = useStore(toolBuilderStore, (state) => {
    const commandId = state.selectedCommand?.id;
    return commandId
      ? toolBuilderSelectors.getExclusionGroupsForCommand(state, commandId)
      : [];
  });
  const parameters = useStore(toolBuilderStore, (state) => {
    const commandId = state.selectedCommand?.id;
    return commandId
      ? toolBuilderSelectors.getParametersForCommand(state, commandId)
      : [];
  });

  const [editingGroup, setEditingGroup] = useState<
    Partial<ExclusionGroup> | undefined
  >();

  const handleAddGroup = () => {
    setEditingGroup({
      name: "",
      exclusionType: "mutual_exclusive",
      parameterIds: [],
      commandId: selectedCommand?.id
    });
  };

  const handleSaveGroup = () => {
    if (!editingGroup?.name || !editingGroup.exclusionType) return;

    if (editingGroup.id) {
      toolBuilderActions.updateExclusionGroup(editingGroup as ExclusionGroup);
    } else {
      toolBuilderActions.addExclusionGroup(
        editingGroup as Omit<ExclusionGroup, "id">
      );
    }
    setEditingGroup(undefined);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) =>
        toolBuilderActions.setDialogOpen("exclusionGroups", open)
      }
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Exclusion Groups</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {exclusionGroups.map((group) => (
            <div
              key={group.id}
              className="p-3 border rounded flex items-center justify-between"
            >
              <div>
                <h4 className="font-medium">{group.name}</h4>
                <div className="flex gap-1 mt-1">
                  {group.parameterIds.map((id) => {
                    const param = parameters.find((p) => p.id === id);
                    return (
                      param && (
                        <span
                          key={id}
                          className="text-xs bg-muted px-1.5 py-0.5 rounded"
                        >
                          {param.name}
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
                  onClick={() =>
                    toolBuilderActions.removeExclusionGroup(group.id!)
                  }
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {!editingGroup && (
            <Button onClick={handleAddGroup} className="w-full">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Group
            </Button>
          )}

          {editingGroup && (
            <div className="space-y-4 border rounded p-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editingGroup.name}
                  onChange={(e) =>
                    setEditingGroup({ ...editingGroup, name: e.target.value })
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
                      exclusionType: value as ExclusionGroup["exclusionType"]
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mutual_exclusive">
                      Mutually Exclusive
                    </SelectItem>
                    <SelectItem value="required_one_of">
                      Required One Of
                    </SelectItem>
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
                      parameterIds: [
                        ...(editingGroup.parameterIds || []),
                        value
                      ]
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Add parameter" />
                  </SelectTrigger>
                  <SelectContent>
                    {parameters
                      .filter((p) => !editingGroup.parameterIds?.includes(p.id))
                      .map((param) => (
                        <SelectItem key={param.id} value={param.id}>
                          {param.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                <div className="flex flex-wrap gap-1 mt-2">
                  {editingGroup.parameterIds?.map((id) => {
                    const param = parameters.find((p) => p.id === id);
                    return (
                      param && (
                        <span
                          key={id}
                          className="flex items-center gap-1 text-sm bg-muted px-2 py-1 rounded"
                        >
                          {param.name}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0"
                            onClick={() =>
                              setEditingGroup({
                                ...editingGroup,
                                parameterIds: editingGroup.parameterIds?.filter(
                                  (pid) => pid !== id
                                )
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

              <div className="flex justify-end gap-2 mt-4">
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
