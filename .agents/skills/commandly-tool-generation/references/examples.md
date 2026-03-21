# Commandly Tool JSON Examples

## 1. Simple single-command tool (curl)

Demonstrates: single default command, Flag / Option / Argument parameter types, `keyValueSeparator`.

```json
{
  "$schema": "https://commandly.divyeshio.in/specification/flat.json",
  "name": "curl",
  "displayName": "Curl",
  "info": {
    "description": "curl is a command line tool and library for transferring data with URLs.",
    "url": "https://curl.se/"
  },
  "commands": [
    {
      "key": "curl",
      "name": "curl",
      "description": "Run curl to download files.",
      "isDefault": true,
      "sortOrder": 1
    }
  ],
  "parameters": [
    {
      "key": "target",
      "name": "Target",
      "description": "URL to download.",
      "parameterType": "Argument",
      "dataType": "String",
      "isRequired": true,
      "position": 1,
      "sortOrder": 5,
      "commandKey": "curl"
    },
    {
      "key": "output",
      "name": "Output",
      "description": "Write to file instead of stdout.",
      "parameterType": "Option",
      "dataType": "String",
      "shortFlag": "-o",
      "longFlag": "--output",
      "keyValueSeparator": " ",
      "sortOrder": 4,
      "commandKey": "curl"
    },
    {
      "key": "location",
      "name": "Location",
      "description": "Follow redirects.",
      "parameterType": "Flag",
      "dataType": "Boolean",
      "shortFlag": "-L",
      "longFlag": "--location",
      "sortOrder": 1,
      "commandKey": "curl"
    },
    {
      "key": "silent",
      "name": "Silent",
      "description": "Silent mode.",
      "parameterType": "Flag",
      "dataType": "Boolean",
      "shortFlag": "-s",
      "longFlag": "--silent",
      "sortOrder": 2,
      "commandKey": "curl"
    }
  ]
}
```

## 2. Tool with Enum parameters (nuclei excerpt)

Demonstrates: `dataType: "Enum"`, `enum.values[]`, `isRepeatable`.

```json
{
  "key": "ip-version",
  "name": "Ip Version",
  "description": "IP version to scan of hostname (4,6) - (default 4).",
  "parameterType": "Option",
  "dataType": "Enum",
  "isRepeatable": true,
  "shortFlag": "-iv",
  "longFlag": "-ip-version",
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
  "commandKey": "nuclei"
}
```

## 3. Multi-command tool (git-style)

Demonstrates: multiple commands, `parentCommandKey` for subcommands, global parameters.

```json
{
  "$schema": "https://commandly.divyeshio.in/specification/flat.json",
  "name": "git",
  "displayName": "Git",
  "info": {
    "description": "Git is a free and open source distributed version control system.",
    "url": "https://git-scm.com/"
  },
  "commands": [
    {
      "key": "git",
      "name": "git",
      "isDefault": true,
      "sortOrder": 1
    },
    {
      "key": "commit",
      "name": "commit",
      "description": "Record changes to the repository.",
      "parentCommandKey": "git",
      "sortOrder": 2
    },
    {
      "key": "push",
      "name": "push",
      "description": "Update remote refs.",
      "parentCommandKey": "git",
      "sortOrder": 3
    }
  ],
  "parameters": [
    {
      "key": "verbose",
      "name": "Verbose",
      "description": "Be more verbose.",
      "parameterType": "Flag",
      "dataType": "Boolean",
      "shortFlag": "-v",
      "longFlag": "--verbose",
      "isGlobal": true
    },
    {
      "key": "commit-message",
      "name": "Message",
      "description": "Use the given message as the commit message.",
      "parameterType": "Option",
      "dataType": "String",
      "shortFlag": "-m",
      "longFlag": "--message",
      "keyValueSeparator": " ",
      "isRequired": true,
      "commandKey": "commit"
    },
    {
      "key": "commit-all",
      "name": "All",
      "description": "Stage all tracked modified/deleted files.",
      "parameterType": "Flag",
      "dataType": "Boolean",
      "shortFlag": "-a",
      "longFlag": "--all",
      "commandKey": "commit"
    },
    {
      "key": "push-force",
      "name": "Force",
      "description": "Force update refs.",
      "parameterType": "Flag",
      "dataType": "Boolean",
      "shortFlag": "-f",
      "longFlag": "--force",
      "commandKey": "push"
    }
  ]
}
```

## 4. Tool with validations and dependencies

Demonstrates: `validations[]`, `dependencies[]`.

```json
{
  "key": "port",
  "name": "Port",
  "description": "Port number to connect to.",
  "parameterType": "Option",
  "dataType": "Number",
  "shortFlag": "-p",
  "longFlag": "--port",
  "keyValueSeparator": " ",
  "commandKey": "connect",
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
      "parameterKey": "port",
      "dependsOnParameterKey": "host",
      "dependencyType": "requires"
    }
  ]
}
```
