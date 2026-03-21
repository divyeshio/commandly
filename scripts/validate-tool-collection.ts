import { readFileSync, writeFileSync } from "fs";
import { basename, resolve } from "path";

import Ajv from "ajv";

import { sanitizeToolJSON } from "../registry/commandly/lib/utils/commandly";

const schemaPath = resolve(import.meta.dir, "../public/specification/flat.json");
const schema = JSON.parse(readFileSync(schemaPath, "utf-8")) as object;

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(schema);

const files = process.argv.slice(2).filter((f) => f.endsWith(".json"));

if (files.length === 0) {
  console.log("No .json files provided. Exiting.");
  process.exit(0);
}

const errors: string[] = [];

for (const file of files) {
  const fileName = basename(file, ".json");

  let raw: string;
  try {
    raw = readFileSync(file, "utf-8");
  } catch {
    errors.push(`❌ \`${file}\`: Could not read file.`);
    continue;
  }

  let tool: Record<string, unknown>;
  try {
    tool = JSON.parse(raw) as Record<string, unknown>;
  } catch (e) {
    errors.push(`❌ \`${file}\`: Invalid JSON — ${(e as Error).message}`);
    continue;
  }

  if (!validate(tool)) {
    const messages = (validate.errors ?? []).map((e) => `  • ${e.instancePath || "/"} ${e.message}`);
    errors.push(`❌ \`${file}\`: Schema validation failed:\n${messages.join("\n")}`);
    continue;
  }

  if (tool.name !== fileName) {
    errors.push(
      `❌ \`${file}\`: \`name\` field (\`${tool.name as string}\`) does not match filename (\`${fileName}\`).`,
    );
    continue;
  }

  if (!Array.isArray(tool.commands) || tool.commands.length === 0) {
    errors.push(`❌ \`${file}\`: \`commands\` must be a non-empty array.`);
    continue;
  }

  const sanitized = sanitizeToolJSON(tool);
  const output = JSON.stringify(sanitized, null, 2);

  if (output !== raw.trimEnd()) {
    writeFileSync(file, output + "\n", "utf-8");
    console.log(`✅ Fixed: ${file}`);
  } else {
    console.log(`✅ OK: ${file}`);
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}
