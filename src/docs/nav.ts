export interface DocNavItem {
  name: string;
  title: string;
}

export interface DocNavSection {
  section: string;
  items: DocNavItem[];
}

export const docsNav: DocNavSection[] = [
  {
    section: "Components",
    items: [
      { name: "generated-command", title: "Generated Command" },
      { name: "json-output", title: "JSON Output" },
      { name: "tool-renderer", title: "Tool Renderer" },
    ],
  },
  {
    section: "Blocks",
    items: [
      { name: "tool-editor", title: "Tool Editor" },
      { name: "ui", title: "Basic UI" },
    ],
  },
];
