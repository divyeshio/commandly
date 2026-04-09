# Commandly Tool JSON Validation

## Validation Script

Use `scripts/validate-tool-collection.ts` to validate tool JSON files against the flat schema.

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
2. Parses the JSON — fails with a clear message on syntax errors.
3. Validates against `public/specification/flat.json` using AJV.
4. Checks that the `name` field matches the filename (e.g. `curl.json` must have `"name": "curl"`).
5. Checks that `commands` is a non-empty array.
6. Runs `sanitizeToolJSON` to strip `metadata` from parameters and inject `$schema`.
7. If the sanitized output differs from the file, **overwrites the file** with the corrected content and prints `✅ Fixed: <file>`.
8. If already correct, prints `✅ OK: <file>`.
9. Exits with code `1` and prints all errors if any validation fails.

### Common errors and fixes

| Error                                                              | Fix                                                                    |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `"name" field does not match filename`                             | Set `"name"` to the bare filename without extension                    |
| `"commands" must be a non-empty array`                             | Add at least one command; use the tool name as the default command key |
| Schema validation: `/ must have required property 'key'`           | Every command and parameter needs a `key` field                        |
| Schema validation: `/ must have required property 'parameterType'` | Set `parameterType` to `"Flag"`, `"Option"`, or `"Argument"`           |
| Schema validation: `/ must have required property 'dataType'`      | Set `dataType` to `"Boolean"`, `"String"`, `"Number"`, or `"Enum"`     |
| Invalid JSON                                                       | Fix syntax (trailing commas, missing quotes, etc.)                     |

### sanitizeToolJSON behaviour

`sanitizeToolJSON` (from `registry/commandly/utils/flat.ts`):

- Strips the `metadata` field from each parameter object.
- Injects `"$schema": "https://commandly.divyeshio.in/specification/flat.json"` at the top level.

The script auto-applies this transform and writes back the file if needed, so generated JSON does not need to manually include `$schema` — the script will add it.

## Validating in Code (TypeScript)

```ts
import { readFileSync } from "fs";
import { resolve } from "path";
import Ajv from "ajv";

const schema = JSON.parse(readFileSync(resolve("public/specification/flat.json"), "utf-8"));
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(schema);

const tool = JSON.parse(readFileSync("my-tool.json", "utf-8"));
if (!validate(tool)) {
  console.error(validate.errors);
}
```
