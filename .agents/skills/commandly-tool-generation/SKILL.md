---
name: commandly-tool-generation
description: Generate, parse, and edit Commandly CLI tool definitions in the Commandly JSON schema format. Use when working with Commandly tool JSON files, converting CLI help text to Commandly format, creating tool definitions from scratch, or modifying existing tool definitions. Triggers on tasks like "generate a tool for X", "parse this help text", "add a parameter to this tool", or "create a Commandly JSON for Y".
---

# Commandly Tool Generation

Generate and edit CLI tool definitions in the Commandly JSON schema format.

## Modes

**1. Parse help text → JSON**: Convert raw `--help` output to a complete tool JSON.
**2. Edit existing tool**: Modify an existing tool definition.
**3. Create from scratch**: Build a tool JSON from a description or knowledge of the CLI.

## Core Workflow

### Parsing Help Text

1. Identify the tool name and any description/version info → populate `binaryName`, `displayName`, optional `interactive`, and `info`.
2. Identify commands and subcommands → `commands[]` array with `key`, `displayName`, `aliases`, and `interactive` when the command prompts for input. Nest subcommands inside the command they belong to via that command's own `commands[]`. If the tool has no subcommands, leave `commands` as an empty array `[]`.
3. Map each flag/option/argument to a parameter → nest it inside the command that accepts it. `key` is the full flag, dashes included; short names go in `aliases`.
4. Parameters belong to exactly one command. Use `Tool.parameters` only for flags the tool accepts before any command is chosen, and add `recursive: true` to the ones that are inherited by the whole tree. A parameter on a command that its subcommands also accept uses `recursive: true` too.
5. Output pure JSON - no code fences, no comments.
6. Identify options which can take pre-defined values and create `Enum` parameters with `enum.values[]`. Note: "e.g." in help text does not necessarily mean the values are free-form - cross-check with documentation to determine if the full value set is known and fixed before using `Enum`.

### Editing Existing Tool

1. Read the current tool JSON carefully.
2. Make only the requested changes.
3. Preserve all existing keys, structure, and optional fields exactly.

### Creating from Scratch

1. Use the CLI binary as `binaryName` (lowercase, hyphenated where appropriate) and a display-friendly `displayName`.
2. If the tool has subcommands, nest each one inside its parent command's `commands[]` array. If it has no subcommands, use `commands: []`. Add `aliases` when a command has alternate spellings and `interactive: true` when it prompts for user input.
3. Map all known parameters following the type rules below.

## Parameter Type Rules

| CLI pattern                  | `parameterType` | `dataType`        | Notes                                    |
| ---------------------------- | --------------- | ----------------- | ---------------------------------------- |
| `--verbose`, `-v` (no value) | `Flag`          | `Boolean`         |                                          |
| `--output <file>`            | `Option`        | `String`          | `key: "--output"`, add `aliases: ["-o"]` |
| `--count <n>`                | `Option`        | `Number`          |                                          |
| `--format <list\|json>`      | `Option`        | `Enum`            | Use `enum.values[]`                      |
| `<positional>`               | `Argument`      | `String`/`Number` | Set `position` (zero-based)              |

- **Key is the full flag**: `key` holds the complete flag, dashes included (`--output`, `-list`). Nothing is derived or prefixed at render time.
- **Aliases are short names and other spellings**: `aliases` holds everything that is _not_ the full flag, e.g. `["-o"]`.
- Preserve the exact prefix the CLI uses. `curl` really does use `--output`, while `httpx` uses `-list`. There is no tool-level flag prefix setting - write the flag as the tool spells it.
- Do not add `shortFlag`, `longFlag`, `flagPrefix`, or any other alias field - `key` and `aliases` are the only fields.
- `Argument` parameters have no dashes in their key and have no `aliases`.

## Key Rules

1. Every `key` must be unique among its own command's parameters. For flags and options it is the full flag, dashes included; for arguments it is a plain positional name.
2. Nest each parameter inside the command that accepts it - a parameter's location defines its scope. Keys only need to be unique among their own command's parameters, so the same flag may appear on sibling commands.
3. Parameters with no command are the tool's own flags, accepted before a command is chosen. Add `recursive: true` to any of them that should also be inherited by every command.
4. Parameter `displayName` should be user-friendly title case (e.g. `--output-file` → `"Output File"`), keeping well-known initialisms upper case (`--ip-version` → `"IP Version"`, `--aws-sigv4` → `"AWS SigV4"`). Command `displayName` should match the actual CLI token used in the command path.
5. Descriptions in sentence case, trimmed.
6. Do not add `defaultValue` - it does not exist in the schema.
7. Do not add empty arrays/objects for optional properties (`validations`, `dependencies`, `exclusionGroups`, `metadata`, `enum`, `metadata.tags`, `installation.sources`, `aliases`). A flag with no short name simply omits `aliases`.
8. Tool description/version live under `info: { description, version, url }` - never at top level. `version` is optional in the schema, but when you include it, use the current release string without a leading `v` unless the upstream project uses a non-semver date or custom release format.
9. Populate `installation.sources` only from the tool's official documentation. Each source needs `key`, `method`, and `command`; add `manager` for `package_manager`, and `url`, `os`, or `note` when the docs provide them. Omit the field entirely when the install method is not documented.
10. Positional argument `position` is zero-based.
11. Persisted tool JSON files should include `$schema: "https://commandly.divyeshio.in/specification/tool.json"`. The validation script can auto-fix this when missing.
12. Output is pure JSON - no backticks, no trailing commas, proper indentation.

## Schema Reference

See [references/schema.md](references/schema.md) for the full field-by-field schema documentation.

## Examples

See [references/examples.md](references/examples.md) for complete tool JSON examples covering simple, enum, and multi-command tools.

## Validation

See [references/validation.md](references/validation.md) for how to validate tool JSON using the TypeScript validation script (`scripts/validate-tool-collection.ts`), common errors and fixes, and in-code AJV usage.
