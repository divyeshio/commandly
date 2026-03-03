import { writeFileSync } from "fs";
import { join } from "path";

import { ToolSchema } from "@/registry/commandly/lib/types/commandly";
import * as z from "zod/v4";

const jsonSchema = z.toJSONSchema(ToolSchema);

const outputPath = join(process.cwd(), "public", "specification", "flat.json");
writeFileSync(outputPath, JSON.stringify(jsonSchema, null, 2));
