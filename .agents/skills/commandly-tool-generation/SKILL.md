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

1. Identify the tool name and any description/version info → populate `name`, `displayName`, `info`.
2. Identify commands and subcommands → `commands[]` array with `key`, `name`, optional `parentCommandKey`.
3. Map each flag/option/argument to a parameter → `parameters[]` array.
4. Assign `commandKey` to non-global parameters.
5. Output pure JSON — no code fences, no comments.
6. Identify options which can take pre-defined values and create `Enum` parameters with `enum.values[]`. Note: "e.g." in help text does not necessarily mean the values are free-form — cross-check with documentation to determine if the full value set is known and fixed before using `Enum`.

### Editing Existing Tool

1. Read the current tool JSON carefully.
2. Make only the requested changes.
3. Preserve all existing keys, structure, and optional fields exactly.

### Creating from Scratch

1. Use tool name as `name` (lowercase, hyphenated) and a display-friendly `displayName`.
2. Create at minimum one command (use the tool name if there are no subcommands, mark `isDefault: true`).
3. Map all known parameters following the type rules below.

## Parameter Type Rules

| CLI pattern | `parameterType` | `dataType` | Notes |
|---|---|---|---|
| `--verbose`, `-v` (no value) | `Flag` | `Boolean` | |
| `--output <file>` | `Option` | `String` | Add `longFlag`, optionally `shortFlag` |
| `--count <n>` | `Option` | `Number` | |
| `--format <list\|json>` | `Option` | `Enum` | Use `enum.values[]` |
| `<positional>` | `Argument` | `String`/`Number` | Set `position` (1-based) |

- **Short flag**: single dash + letter (e.g. `-o`). Include only if present.
- **Long flag**: double dash + word (e.g. `--output`). Preserve exact prefix.
- **Aliases**: If a param has multiple forms, the first is `name`/primary flag, rest go in `aliases` (rare in Commandly; prefer `shortFlag` + `longFlag`).

## Key Rules

1. Every `key` must be unique across the entire `parameters[]` array. It should be meaningful and derived from the parameter name or description.
2. Non-global parameters **must** have `commandKey`. Global parameters **must not**.
3. `name` should be user-friendly title case (e.g. `--output-file` → `"Output File"`).
4. Descriptions in sentence case, trimmed.
5. Do not add `defaultValue` — it does not exist in the schema.
6. Do not add empty arrays/objects for optional properties (`validations`, `exclusionGroups`, `tags`, `dependencies`, `enum.values` when empty).
7. Tool description/version live under `info: { description, version, url }` — never at top level. `version` is **required** and must reflect the current release (no `v` prefix, e.g. `"1.9.0"` not `"v1.9.0"`). To find the latest version, call `GET https://api.github.com/repos/{owner}/{repo}/releases/latest` and use the `tag_name` field with the leading `v` stripped. For tools with non-standard tag formats (e.g. curl uses `curl-8_19_0`), use the release `name` field instead. For date-based versioning (e.g. yt-dlp uses `2026.03.17`), use `tag_name` as-is.
8. If only one command exists, do not mark all parameters as global.
9. There must always be at least one command. If no subcommand is found, create one with the tool name.
10. Output is pure JSON — no backticks, no trailing commas, proper indentation.

## Schema Reference

See [references/schema.md](references/schema.md) for the full field-by-field schema documentation.

## Examples

See [references/examples.md](references/examples.md) for complete tool JSON examples covering simple, enum, and multi-command tools.

## Validation

See [references/validation.md](references/validation.md) for how to validate tool JSON using the TypeScript validation script (`scripts/validate-tool-collection.ts`), common errors and fixes, and in-code AJV usage.
