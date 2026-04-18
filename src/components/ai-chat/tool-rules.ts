export const SCHEMA_URL = "https://commandly.divyeshio.in/specification/flat.json";

export const SORTING_RULES = `1. Sort all parameters, grouping similar ones together (e.g., output options, filter options, connection options)
2. Update parameter names and descriptions to be consistent within each group
3. Parameters related to verbose, debug, or logging should be at the end
4. Positional arguments should be sorted by their position field
5. Global parameters should be listed before command-specific parameters`;

export const GROUPING_RULES = `1. Group similar parameters using the group field (e.g., Output, Filter, Connection, Debug)
2. Output-related parameters (format, output, json, csv) should be grouped together
3. Network/connection parameters (timeout, proxy, rate-limit) should be grouped together
4. Filtering parameters (include, exclude, match) should be grouped together
5. Verbose, debug, silent, and logging parameters should be grouped at the end`;

export const TYPE_FIX_RULES = `1. Flags (boolean switches) must have parameterType Flag and dataType Boolean
2. Options that accept enum values must have dataType Enum with valid enum values
3. Options that accept numbers (port, timeout, count, limit, rate) should have dataType Number
4. Options that accept file paths, URLs, or free text should have dataType String
5. If a parameter accepts multiple values packed into a single argument separated by a character (e.g. --hosts a,b,c), set arraySeparator to that character - do NOT set isRepeatable
6. If a parameter can be specified multiple times as separate flags (e.g. --host a --host b --host c), set isRepeatable - do NOT use arraySeparator
7. If a parameter uses key=value syntax, set keyValueSeparator
8. Mark parameters as isRequired when they must be provided`;

export const VALIDATION_RULES = `1. All parameter keys must be unique across the tool
2. All command keys must be unique across the tool
3. Parameters with isGlobal must not have commandKey
4. Parameters without isGlobal must have commandKey when multiple commands exist
5. Enum parameters must have at least one enum value
6. Enum values must have both value and displayName
7. Validation keys must be unique within a parameter
8. Dependency parameterKey and dependsOnParameterKey must reference existing parameters
9. Exclusion group parameterKeys must reference existing parameters
10. Descriptions should be in sentence case
11. Do not add empty arrays or objects for optional properties
12. Tool description and version must be nested under an info object`;

export const PROMPT_PILLS = [
  {
    label: "Sorting & Grouping",
    text: `Sort all parameters, grouping similar ones together (e.g., output options, filter options, connection options). Update parameter names and descriptions to be consistent within each group. Anything related to verbose, debug, or logging should be at the end.`,
  },
  {
    label: "Update from docs",
    text: "Update this tool's description, parameter descriptions, and types to accurately reflect the official documentation. Make descriptions concise and in sentence case.",
  },
  {
    label: "Fix types & validation",
    text: "Fix parameter types (string, number, boolean, array), mark required parameters correctly, and add appropriate validation rules where needed.",
  },
];

export const ALL_RULES = {
  sorting: SORTING_RULES,
  grouping: GROUPING_RULES,
  typeFix: TYPE_FIX_RULES,
  validation: VALIDATION_RULES,
};
