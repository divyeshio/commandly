export interface DocNavItem {
  /** The page's module under `src/routes/docs/__collection__`, or `null` for the docs index. */
  name: string | null;
  title: string;
}

export interface DocNavSection {
  section?: string;
  items: DocNavItem[];
}

export const docsNav: DocNavSection[] = [
  {
    items: [{ name: null, title: "Overview" }],
  },
  {
    section: "Components",
    items: [
      { name: "tool-renderer", title: "Tool Renderer" },
      { name: "generated-command", title: "Generated Command" },
      { name: "json-output", title: "JSON Output" },
      { name: "command-tree", title: "Command Tree" },
      { name: "installation", title: "Installation" },
    ],
  },
  {
    section: "Blocks",
    items: [{ name: "ui", title: "Basic UI" }],
  },
  {
    section: "Specification",
    items: [
      { name: "specification-intro", title: "Introduction" },
      { name: "specification-schema", title: "Schema Reference" },
      { name: "specification-examples", title: "Examples" },
    ],
  },
];
