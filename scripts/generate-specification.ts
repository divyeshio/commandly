import { writeFileSync } from "fs";
import { join } from "path";

import * as TJS from "typescript-json-schema";

const settings: TJS.PartialArgs = {
  required: true,
  ref: true,
};

const tsConfigPath = join(process.cwd(), "tsconfig.json");

const flatProgram = TJS.programFromConfig(tsConfigPath, [
  join(process.cwd(), "registry/commandly/lib/types/commandly.ts"),
]);
const flatSchema = TJS.generateSchema(flatProgram, "Tool", settings);
const flatOutputPath = join(process.cwd(), "public", "specification", "flat.json");
writeFileSync(flatOutputPath, JSON.stringify(flatSchema, null, 2));

const nestedProgram = TJS.programFromConfig(tsConfigPath, [
  join(process.cwd(), "registry/commandly/lib/types/commandly-nested.ts"),
]);
const nestedSchema = TJS.generateSchema(nestedProgram, "NestedTool", settings);
const nestedOutputPath = join(process.cwd(), "public", "specification", "nested.json");
writeFileSync(nestedOutputPath, JSON.stringify(nestedSchema, null, 2));
