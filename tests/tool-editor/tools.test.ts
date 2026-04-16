import { applyMergePatch } from "@/components/tool-editor/tools";
import { defaultTool } from "@/lib/utils";

describe("applyMergePatch", () => {
  it("merges top-level scalar fields into base", () => {
    const base = defaultTool("curl");
    const result = applyMergePatch(base, { displayName: "cURL Updated" });
    expect(result.displayName).toBe("cURL Updated");
  });

  it("preserves unpatched fields from base", () => {
    const base = defaultTool("curl");
    const result = applyMergePatch(base, { displayName: "cURL Updated" });
    expect(result.binaryName).toBe("curl");
  });

  it("removes top-level fields set to null in the patch", () => {
    const base = { ...defaultTool("curl"), info: { description: "A transfer tool" } };
    const result = applyMergePatch(base as unknown as Parameters<typeof applyMergePatch>[0], { info: null } as unknown as Parameters<typeof applyMergePatch>[1]);
    expect((result as unknown as Record<string, unknown>).info).toBeUndefined();
  });

  it("does not mutate the base tool", () => {
    const base = defaultTool("curl");
    applyMergePatch(base, { displayName: "New Name" });
    expect(base.displayName).toBe("My Tool");
  });

  it("replaces arrays entirely rather than merging them", () => {
    const base = defaultTool("curl");
    const newParams = [
      {
        key: "output",
        name: "Output",
        longFlag: "--output",
        parameterType: "Option" as const,
        dataType: "String" as const,
        isRequired: false,
        isRepeatable: false,
      },
    ];
    const result = applyMergePatch(base, { parameters: newParams });
    expect(result.parameters).toHaveLength(1);
    expect(result.parameters[0].key).toBe("output");
  });

  it("applies multiple patches independently", () => {
    const base = defaultTool("curl");
    const first = applyMergePatch(base, { displayName: "Step 1" });
    const second = applyMergePatch(first, { binaryName: "wget" });
    expect(second.displayName).toBe("Step 1");
    expect(second.binaryName).toBe("wget");
  });
});
