import { writeFileSync } from "fs";
import { join } from "path";

import { ToolSchema } from "@/registry/commandly/lib/types/commandly";
import { NestedToolSchema } from "@/registry/commandly/lib/types/commandly-nested";
import * as z from "zod/v4";

// Generate Flat Specification
const flatJsonSchema = z.toJSONSchema(ToolSchema);
const flatOutputPath = join(process.cwd(), "public", "specification", "flat.json");
writeFileSync(flatOutputPath, JSON.stringify(flatJsonSchema, null, 2));

// Generate Nested Specification
const nestedJsonSchema = z.toJSONSchema(NestedToolSchema);
const nestedOutputPath = join(process.cwd(), "public", "specification", "nested.json");
writeFileSync(nestedOutputPath, JSON.stringify(nestedJsonSchema, null, 2));

