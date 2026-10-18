# Commandly Tool JSON Validation

## Validation Script

Use `scripts/validate-tool-collection.ts` to validate tool JSON files against the schema.

### Usage

```bash
bun scripts/validate-tool-collection.ts public/tools-collection/<tool-name>.json
```

Multiple files at once:

```bash
bun scripts/validate-tool-collection.ts public/tools-collection/*.json
```

### What the script does

1. Reads each `.json` file passed as a CLI argument.
2. Parses the JSON - fails with a clear message on syntax errors.
3. Validates against `public/specification/tool.json` using AJV.
4. Checks that `binaryName` matches the filename (e.g. `curl.json` must have `"binaryName": "curl"`).
5. Runs repo-specific validation from `registry/commandly/utils/tool-validation.ts`.
6. Runs `fixTool(tool, { addSchema: true, removeMetadata: true })`.
7. If the fixed output differs from the file, **overwrites the file** with the corrected content and prints `✅ Fixed: <file>`.
8. If already correct, prints `✅ OK: <file>`.
9. Exits with code `1` and prints all schema or validation errors if any validation fails.

### Common errors and fixes

| Error                                                              | Fix                                                                |
| ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `"binaryName" field (... ) does not match filename (...)`          | Set `"binaryName"` to the bare filename without extension          |
| Schema validation: `/ must have required property 'key'`           | Every command and parameter needs a `key` field                    |
| Schema validation: `/ must have required property 'parameterType'` | Set `parameterType` to `"Flag"`, `"Option"`, or `"Argument"`       |
| Schema validation: `/ must have required property 'dataType'`      | Set `dataType` to `"Boolean"`, `"String"`, `"Number"`, or `"Enum"` |
| `Duplicate parameter key "..."`                                    | Keys must be unique among their own command's parameters           |
| Invalid JSON                                                       | Fix syntax (trailing commas, missing quotes, etc.)                 |

### `fixTool` behaviour

`fixTool` (from `registry/commandly/utils/tool-file.ts`) currently:

- Injects `"$schema": "https://commandly.divyeshio.in/specification/tool.json"` at the top level.
- Strips `metadata` from parameters when validation runs with `removeMetadata: true`.
- Removes top-level `metadata` when validation runs with `removeMetadata: true`.
- Removes empty `exclusionGroups`.
- Removes redundant default values such as `false` booleans and the default option separator of a single space.

The script auto-applies this transform and writes back the file if needed, so generated JSON can omit `$schema` during drafting, but committed files should end up with it after validation.

## Validating in Code (TypeScript)

```ts
import { readFileSync } from "fs";
import { resolve } from "path";

import {
  validateTool,
  hasErrors,
  formatValidationErrors,
} from "@/components/commandly/utils/tool-validation";
import Ajv from "ajv";

const schema = JSON.parse(readFileSync(resolve("public/specification/tool.json"), "utf-8"));
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(schema);

const tool = JSON.parse(readFileSync("my-tool.json", "utf-8"));
if (!validate(tool)) {
  console.error(validate.errors);
}

const toolErrors = validateTool(tool);
if (hasErrors(toolErrors)) {
  console.error(formatValidationErrors(toolErrors));
}
```
