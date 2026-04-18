---
name: commandly-tool-generation
description: Generate, parse, and edit Commandly CLI tool definitions in the flat JSON schema format. Use when working with Commandly tool JSON files, converting CLI help text to Commandly format, creating tool definitions from scratch, or modifying existing tool definitions. Triggers on tasks like "generate a tool for X", "parse this help text", "add a parameter to this tool", or "create a Commandly JSON for Y".
---

# Commandly Tool Generation

Generate and edit CLI tool definitions in the Commandly flat JSON schema format.

## Modes

**1. Parse help text → JSON**: Convert raw `--help` output to a complete tool JSON.
**2. Edit existing tool**: Modify an existing tool definition.
**3. Create from scratch**: Build a tool JSON from a description or knowledge of the CLI.

## Core Workflow

### Parsing Help Text

1. Identify the tool name and any description/version info → populate `binaryName`, `displayName`, optional `interactive`, and `info`.
2. Identify commands and subcommands → `commands[]` array with `key`, `name`, optional `parentCommandKey`. If the tool has no subcommands, leave `commands` as an empty array `[]`.
3. Map each flag/option/argument to a parameter → `parameters[]` array.
4. If commands exist, assign `commandKey` to non-global parameters. If no commands exist, parameters are **root parameters** — omit both `commandKey` and `isGlobal`.
5. Output pure JSON — no code fences, no comments.
6. Identify options which can take pre-defined values and create `Enum` parameters with `enum.values[]`. Note: "e.g." in help text does not necessarily mean the values are free-form — cross-check with documentation to determine if the full value set is known and fixed before using `Enum`.

### Editing Existing Tool

1. Read the current tool JSON carefully.
2. Make only the requested changes.
3. Preserve all existing keys, structure, and optional fields exactly.

### Creating from Scratch

1. Use the CLI binary as `binaryName` (lowercase, hyphenated where appropriate) and a display-friendly `displayName`.
2. If the tool has subcommands, add them to `commands[]`. If it has no subcommands, use `commands: []`.
3. Map all known parameters following the type rules below.

## Parameter Type Rules

| CLI pattern                  | `parameterType` | `dataType`        | Notes                                  |
| ---------------------------- | --------------- | ----------------- | -------------------------------------- |
| `--verbose`, `-v` (no value) | `Flag`          | `Boolean`         |                                        |
| `--output <file>`            | `Option`        | `String`          | Add `longFlag`, optionally `shortFlag` |
| `--count <n>`                | `Option`        | `Number`          |                                        |
| `--format <list\|json>`      | `Option`        | `Enum`            | Use `enum.values[]`                    |
| `<positional>`               | `Argument`      | `String`/`Number` | Set `position` (zero-based)            |

- **Short flag**: single dash + letter (e.g. `-o`). Include only if present.
- **Long flag**: double dash + word (e.g. `--output`). Preserve exact prefix.
- Do not invent extra alias fields. Use `shortFlag` and `longFlag` only; if the CLI exposes more variants than the schema supports, keep the canonical forms and mention the edge case in `description` only when it materially affects usage.

## Key Rules

1. Every `key` must be unique across the entire `parameters[]` array. It should be meaningful and derived from the parameter name or description.
2. When `commands` is non-empty: non-global parameters **must** have `commandKey`, global parameters **must** have `isGlobal: true` and no `commandKey`.
3. When `commands` is empty: parameters are **root parameters** — they must **not** have `commandKey` or `isGlobal`. Do not create a dummy command matching the tool name.
4. Parameter `name` should be user-friendly title case (e.g. `--output-file` → `"Output File"`). Command `name` should match the actual CLI token used in the command path.
5. Descriptions in sentence case, trimmed.
6. Do not add `defaultValue` — it does not exist in the schema.
7. Do not add empty arrays/objects for optional properties (`validations`, `dependencies`, `exclusionGroups`, `metadata`, `enum`, `metadata.tags`).
8. Tool description/version live under `info: { description, version, url }` — never at top level. `version` is optional in the schema, but when you include it, use the current release string without a leading `v` unless the upstream project uses a non-semver date or custom release format.
9. Positional argument `position` is zero-based.
10. Persisted tool JSON files should include `$schema: "https://commandly.divyeshio.in/specification/flat.json"`. The validation script can auto-fix this when missing.
11. Output is pure JSON — no backticks, no trailing commas, proper indentation.

## Schema Reference

See [references/schema.md](references/schema.md) for the full field-by-field schema documentation.

## Examples

See [references/examples.md](references/examples.md) for complete tool JSON examples covering simple, enum, and multi-command tools.

## Validation

See [references/validation.md](references/validation.md) for how to validate tool JSON using the TypeScript validation script (`scripts/validate-tool-collection.ts`), common errors and fixes, and in-code AJV usage.
