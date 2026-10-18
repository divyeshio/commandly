# Commandly Tool JSON Examples

## 1. Simple tool with no subcommands (curl)

Demonstrates: a tool with no commands, Flag / Option / Argument parameter types, `keyValueSeparator`.

```json
{
  "$schema": "https://commandly.divyeshio.in/specification/tool.json",
  "binaryName": "curl",
  "displayName": "Curl",
  "info": {
    "description": "curl is a command line tool and library for transferring data with URLs.",
    "url": "https://curl.se/"
  },
  "commands": [],
  "parameters": [
    {
      "key": "target",
      "displayName": "Target",
      "description": "URL to download.",
      "parameterType": "Argument",
      "dataType": "String",
      "isRequired": true,
      "position": 0,
      "sortOrder": 5
    },
    {
      "key": "--output",
      "displayName": "Output",
      "description": "Write to file instead of stdout.",
      "parameterType": "Option",
      "dataType": "String",
      "aliases": ["-o"],
      "keyValueSeparator": " ",
      "sortOrder": 4
    },
    {
      "key": "--location",
      "displayName": "Location",
      "description": "Follow redirects.",
      "parameterType": "Flag",
      "dataType": "Boolean",
      "aliases": ["-L"],
      "sortOrder": 1
    },
    {
      "key": "--silent",
      "displayName": "Silent",
      "description": "Silent mode.",
      "parameterType": "Flag",
      "dataType": "Boolean",
      "aliases": ["-s"],
      "sortOrder": 2
    }
  ]
}
```

## 2. Tool with Enum parameters (nuclei excerpt)

Demonstrates: `dataType: "Enum"`, `enum.values[]`, `isRepeatable`.

```json
{
  "key": "--ip-version",
  "displayName": "IP Version",
  "description": "IP version to scan of hostname (4,6) - (default 4).",
  "parameterType": "Option",
  "dataType": "Enum",
  "isRepeatable": true,
  "aliases": ["-iv"],
  "enum": {
    "values": [
      {
        "value": "4",
        "displayName": "4",
        "description": "Use IPv4.",
        "isDefault": true,
        "sortOrder": 1
      },
      {
        "value": "6",
        "displayName": "6",
        "description": "Use IPv6.",
        "isDefault": false,
        "sortOrder": 2
      }
    ]
  },
  "sortOrder": 1
}
```

## 3. Multi-command tool (git-style)

Demonstrates: multiple commands, each owning its parameters, a nested subcommand, and a tool-level recursive parameter that applies to every command.

```json
{
  "$schema": "https://commandly.divyeshio.in/specification/tool.json",
  "binaryName": "git",
  "displayName": "Git",
  "info": {
    "description": "Git is a free and open source distributed version control system.",
    "url": "https://git-scm.com/"
  },
  "parameters": [
    {
      "key": "--verbose",
      "displayName": "Verbose",
      "description": "Be more verbose.",
      "parameterType": "Flag",
      "dataType": "Boolean",
      "aliases": ["-v"],
      "recursive": true
    }
  ],
  "commands": [
    {
      "key": "commit",
      "displayName": "commit",
      "description": "Record changes to the repository.",
      "sortOrder": 1,
      "parameters": [
        {
          "key": "--message",
          "displayName": "Message",
          "description": "Use the given message as the commit message.",
          "parameterType": "Option",
          "dataType": "String",
          "aliases": ["-m"],
          "keyValueSeparator": " ",
          "isRequired": true
        },
        {
          "key": "--all",
          "displayName": "All",
          "description": "Stage all tracked modified/deleted files.",
          "parameterType": "Flag",
          "dataType": "Boolean",
          "aliases": ["-a"]
        }
      ]
    },
    {
      "key": "push",
      "displayName": "push",
      "description": "Update remote refs.",
      "sortOrder": 2,
      "parameters": [
        {
          "key": "--force",
          "displayName": "Force",
          "description": "Force update refs.",
          "parameterType": "Flag",
          "dataType": "Boolean",
          "aliases": ["-f"]
        }
      ]
    },
    {
      "key": "remote",
      "displayName": "remote",
      "description": "Manage the set of tracked repositories.",
      "sortOrder": 3,
      "commands": [
        {
          "key": "remote-add",
          "displayName": "add",
          "description": "Add a remote named <name> for the repository.",
          "parameters": [
            {
              "key": "name",
              "displayName": "Name",
              "description": "Name of the remote.",
              "parameterType": "Argument",
              "dataType": "String",
              "position": 0,
              "isRequired": true
            },
            {
              "key": "url",
              "displayName": "URL",
              "description": "URL of the remote repository.",
              "parameterType": "Argument",
              "dataType": "String",
              "position": 1,
              "isRequired": true
            }
          ]
        },
        {
          "key": "remote-remove",
          "displayName": "remove",
          "description": "Remove the remote named <name>.",
          "parameters": [
            {
              "key": "name",
              "displayName": "Name",
              "description": "Name of the remote to remove.",
              "parameterType": "Argument",
              "dataType": "String",
              "position": 0,
              "isRequired": true
            }
          ]
        }
      ]
    }
  ]
}
```

## 4. Tool with validations and dependencies

Demonstrates: `validations[]`, `dependencies[]`.

```json
[
  {
    "key": "--host",
    "displayName": "Host",
    "description": "Host to connect to.",
    "parameterType": "Option",
    "dataType": "String",
    "aliases": ["-h"]
  },
  {
    "key": "--port",
    "displayName": "Port",
    "description": "Port number to connect to.",
    "parameterType": "Option",
    "dataType": "Number",
    "aliases": ["-p"],
    "keyValueSeparator": " ",
    "validations": [
      {
        "key": "port-min",
        "validationType": "min_value",
        "validationValue": "1",
        "errorMessage": "Port must be at least 1."
      },
      {
        "key": "port-max",
        "validationType": "max_value",
        "validationValue": "65535",
        "errorMessage": "Port must not exceed 65535."
      }
    ],
    "dependencies": [
      {
        "key": "port-requires-host",
        "parameterKey": "--port",
        "dependsOnParameterKey": "--host",
        "dependencyType": "requires"
      }
    ]
  }
]
```
