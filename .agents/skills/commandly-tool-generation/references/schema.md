# Commandly Schema Reference

## Tool (root)

| Field             | Type             | Required | Notes                                         |
| ----------------- | ---------------- | -------- | --------------------------------------------- |
| `binaryName`      | string           | ✓        | Lowercase CLI binary name (e.g. `"curl"`)     |
| `displayName`     | string           | ✓        | Human-friendly title (e.g. `"Curl"`)          |
| `interactive`     | boolean          |          | True if invoking the root tool opens a prompt |
| `info`            | ToolInfo         |          | Description, version, URL                     |
| `installation`    | Installation     |          | Structured installation sources               |
| `commands`        | Command[]        | ✓        | Can be empty for tools with no subcommands    |
| `parameters`      | Parameter[]      | ✓        | Can be empty array                            |
| `exclusionGroups` | ExclusionGroup[] |          | Omit if unused                                |
| `metadata`        | ToolMetadata     |          | Omit if unused                                |

## ToolInfo

| Field         | Type   | Notes             |
| ------------- | ------ | ----------------- |
| `description` | string | Tool description  |
| `version`     | string | e.g. `"3.7.1"`    |
| `url`         | string | Homepage/docs URL |

## Command

| Field             | Type             | Required | Notes                                        |
| ----------------- | ---------------- | -------- | -------------------------------------------- |
| `key`             | string           | ✓        | Unique identifier, e.g. `"curl"` or `"scan"` |
| `displayName`     | string           | ✓        | Display name                                 |
| `description`     | string           |          |                                              |
| `aliases`         | string[]         |          | Alternate spellings of the command token     |
| `interactive`     | boolean          |          | True if command opens interactive session    |
| `sortOrder`       | number           |          | Display order                                |
| `parameters`      | Parameter[]      |          | Parameters the command accepts               |
| `exclusionGroups` | ExclusionGroup[] |          | Groups among this command's parameters       |
| `commands`        | Command[]        |          | Subcommands nested beneath this command      |

## Parameter

| Field           | Type              | Required | Notes                                                                                 |
| --------------- | ----------------- | -------- | ------------------------------------------------------------------------------------- |
| `key`           | string            | ✓        | Unique among its command's parameters; the full flag including dashes                 |
| `displayName`   | string            | ✓        | User-friendly title case                                                              |
| `parameterType` | ParameterType     | ✓        | `"Flag"` \| `"Option"` \| `"Argument"`                                                |
| `dataType`      | ParameterDataType | ✓        | `"Boolean"` \| `"String"` \| `"Number"` \| `"Enum"`                                   |
| `description`   | string            |          | Sentence case                                                                         |
| `group`         | string            |          | Visual grouping label                                                                 |
| `isRequired`    | boolean           |          |                                                                                       |
| `isRepeatable`  | boolean           |          | True if flag can appear multiple times                                                |
| `aliases`       | string[]          |          | Short names and other spellings, e.g. `["-o"]`. The full flag lives in `key`          |
| `recursive`     | boolean           |          | True if the parameter is also usable from the subcommands of its command, recursively |

| `position` | number | | Zero-based; only for `Argument` type |
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
    {
      "value": "json",
      "displayName": "JSON",
      "description": "Output as JSON.",
      "isDefault": true,
      "sortOrder": 1
    },
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
  "parameterKey": "--output",
  "dependsOnParameterKey": "--format",
  "dependencyType": "requires",
  "conditionValue": "json"
}
```

Valid `dependencyType` values: `"requires"`, `"conflicts_with"`

## ExclusionGroup

Declared inside the command that owns the parameters, or on the tool for its own parameters.

```json
{
  "key": "mode-group",
  "displayName": "Mode",
  "exclusionType": "mutual_exclusive",
  "parameterKeys": ["--fast-mode", "--deep-mode"]
}
```

Valid `exclusionType` values: `"mutual_exclusive"`, `"required_one_of"`

## Installation

```json
{
  "installation": {
    "sources": [
      {
        "key": "go-install",
        "method": "package_manager",
        "manager": "go",
        "command": "go install -v github.com/projectdiscovery/httpx/cmd/httpx@latest",
        "url": "https://docs.projectdiscovery.io/opensource/httpx/install"
      },
      {
        "key": "brew",
        "method": "package_manager",
        "manager": "brew",
        "command": "brew install httpx",
        "os": ["linux", "macos"]
      },
      {
        "key": "release-binary",
        "method": "binary",
        "command": "https://github.com/projectdiscovery/httpx/releases",
        "note": "Download the latest binary for your OS and unzip it."
      }
    ]
  }
}
```

### InstallationSource

| Field     | Type               | Required | Notes                                                       |
| --------- | ------------------ | -------- | ----------------------------------------------------------- |
| `key`     | string             | ✓        | Unique identifier within the tool                           |
| `method`  | InstallationMethod | ✓        | `package_manager` \| `binary` \| `docker` \| `script`       |
| `manager` | string             |          | Only for `package_manager`, e.g. `brew`, `go`, `npm`, `pip` |
| `command` | string             | ✓        | The command that installs the tool                          |
| `url`     | string             |          | Documentation URL for this method                           |
| `os`      | string[]           |          | `linux` \| `macos` \| `windows`. Omit when unrestricted     |
| `note`    | string             |          | Prerequisites or platform notes                             |

Only transcribe commands that the tool's official documentation actually shows.

## $schema

Tool JSON files stored in `tools-collection` should include this top-level field. The validation script can inject it automatically:

```json
"$schema": "https://commandly.divyeshio.in/specification/tool.json"
```
