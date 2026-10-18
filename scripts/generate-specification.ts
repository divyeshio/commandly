import { writeFileSync } from "fs";
import { join } from "path";

import * as TJS from "typescript-json-schema";

const settings: TJS.PartialArgs = {
  required: true,
  ref: true,
};

const tsConfigPath = join(process.cwd(), "tsconfig.json");

const program = TJS.programFromConfig(tsConfigPath, [
  join(process.cwd(), "registry/commandly/types/tool.ts"),
]);
const schema = TJS.generateSchema(program, "Tool", settings);
const outputPath = join(process.cwd(), "public", "specification", "tool.json");
writeFileSync(outputPath, JSON.stringify(schema, null, 2));
