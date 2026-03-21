# Commandly Flat Schema Reference

## Tool (root)

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | ✓ | Lowercase, hyphenated CLI name (e.g. `"curl"`) |
| `displayName` | string | ✓ | Human-friendly title (e.g. `"Curl"`) |
| `info` | ToolInfo | | Description, version, URL |
| `commands` | Command[] | ✓ | At least one required |
| `parameters` | Parameter[] | ✓ | Can be empty array |
| `exclusionGroups` | ExclusionGroup[] | | Omit if unused |
| `metadata` | ToolMetadata | | Omit if unused |

## ToolInfo

| Field | Type | Notes |
|---|---|---|
| `description` | string | Tool description |
| `version` | string | e.g. `"3.7.1"` |
| `url` | string | Homepage/docs URL |

## Command

| Field | Type | Required | Notes |
|---|---|---|---|
| `key` | string | ✓ | Unique identifier, e.g. `"curl"` or `"scan"` |
| `name` | string | ✓ | Display name |
| `parentCommandKey` | string | | For subcommands; key of parent |
| `description` | string | | |
| `interactive` | boolean | | True if command opens interactive session |
| `isDefault` | boolean | | True for the root/default command |
| `sortOrder` | number | | Display order |

## Parameter

| Field | Type | Required | Notes |
|---|---|---|---|
| `key` | string | ✓ | Unique across all parameters |
| `name` | string | ✓ | User-friendly title case |
| `parameterType` | ParameterType | ✓ | `"Flag"` \| `"Option"` \| `"Argument"` |
| `dataType` | ParameterDataType | ✓ | `"Boolean"` \| `"String"` \| `"Number"` \| `"Enum"` |
| `commandKey` | string | | Required if not global; omit if global |
| `description` | string | | Sentence case |
| `group` | string | | Visual grouping label |
| `isRequired` | boolean | | |
| `isRepeatable` | boolean | | True if flag can appear multiple times |
| `isGlobal` | boolean | | True if applies to all commands |
| `shortFlag` | string | | e.g. `"-o"`. Omit if none. |
| `longFlag` | string | | e.g. `"--output"`. Preserve exact prefix. |
| `position` | number | | 1-based; only for `Argument` type |
| `sortOrder` | number | | Display order |
| `arraySeparator` | string | | For array-valued options |
| `keyValueSeparator` | string | | `" "` or `"="` |
| `enum` | ParameterEnumValues | | Required when `dataType` is `"Enum"` |
| `validations` | ParameterValidation[] | | Omit if unused |
| `dependencies` | ParameterDependency[] | | Omit if unused |
| `metadata` | ParameterMetadata | | Contains `tags[]` |

## ParameterEnumValues

```json
{
  "values": [
    { "value": "json", "displayName": "JSON", "description": "Output as JSON.", "isDefault": true, "sortOrder": 1 },
    { "value": "text", "displayName": "Text", "sortOrder": 2 }
  ],
  "allowMultiple": false,
  "separator": ","
}
```
- `allowMultiple` and `separator` are optional (defaults: `false`, `","`)

## ParameterValidation

```json
{
  "key": "min-len-validation",
  "validationType": "min_length",
  "validationValue": "3",
  "errorMessage": "Must be at least 3 characters."
}
```
Valid `validationType` values: `"min_length"`, `"max_length"`, `"min_value"`, `"max_value"`, `"regex"`

## ParameterDependency

```json
{
  "key": "output-requires-format",
  "parameterKey": "output",
  "dependsOnParameterKey": "format",
  "dependencyType": "requires",
  "conditionValue": "json"
}
```
Valid `dependencyType` values: `"requires"`, `"conflicts_with"`

## ExclusionGroup

```json
{
  "key": "mode-group",
  "commandKey": "scan",
  "name": "Mode",
  "exclusionType": "mutual_exclusive",
  "parameterKeys": ["fast-mode", "deep-mode"]
}
```
Valid `exclusionType` values: `"mutual_exclusive"`, `"required_one_of"`

## $schema

Always include at the top of tool JSON files in the tools-collection:
```json
"$schema": "https://commandly.divyeshio.in/specification/flat.json"
```
