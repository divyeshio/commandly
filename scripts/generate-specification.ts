import { ToolSchema } from "@/registry/commandly/lib/types/commandly";
import * as z from "zod/v4";
import { writeFileSync } from "fs";
import { join } from "path";

const jsonSchema = z.toJSONSchema(ToolSchema);

const outputPath = join(process.cwd(), "public", "specification", "flat.json");
writeFileSync(outputPath, JSON.stringify(jsonSchema, null, 2));
