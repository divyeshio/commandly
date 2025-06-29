import { ToolSchema } from "../src/tools/lib/types/tool-editor";
import * as z from "zod/v4";
import { writeFileSync } from "fs";
import { join } from "path";

const jsonSchema = z.toJSONSchema(ToolSchema);

const outputPath = join(process.cwd(), "specification", "flat.json");
writeFileSync(outputPath, JSON.stringify(jsonSchema, null, 2));
