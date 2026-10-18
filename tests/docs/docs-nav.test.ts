import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { docsNav } from "@/components/docs/nav";

const COLLECTION = join(process.cwd(), "src", "routes", "docs", "__collection__");

const navItems = docsNav.flatMap((section) => section.items);

describe("docs navigation", () => {
  it("points every named entry at a collection page that exists", () => {
    const missing = navItems
      .flatMap((item) => (item.name === null ? [] : [item.name]))
      .filter((name) => !existsSync(join(COLLECTION, `${name}.mdx`)));

    expect(missing).toEqual([]);
  });

  it("lists every collection page in the navigation", () => {
    const pages = readdirSync(COLLECTION)
      .filter((file) => file.endsWith(".mdx"))
      .map((file) => file.replace(/\.mdx$/, ""));
    const linked = navItems.flatMap((item) => (item.name === null ? [] : [item.name]));

    expect([...pages].sort()).toEqual([...linked].sort());
  });

  it("marks exactly one entry as the docs index", () => {
    expect(navItems.filter((item) => item.name === null)).toHaveLength(1);
  });
});
