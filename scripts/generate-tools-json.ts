import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

import type { Tool } from "../registry/commandly/lib/types/commandly";

const collectionDir = join(process.cwd(), "public", "tools-collection");
const files = readdirSync(collectionDir).filter((f) => f.endsWith(".json"));

const tools = files.map((file) => {
  const content = readFileSync(join(collectionDir, file), "utf-8");
  const tool = JSON.parse(content) as Tool;
  return {
    name: tool.name,
    displayName: tool.displayName || tool.name,
    description: tool.info?.description,
    url: tool.info?.url,
  };
});

const outputPath = join(process.cwd(), "public", "tools.json");
writeFileSync(outputPath, JSON.stringify(tools, null, 2));
console.log(`Generated tools.json with ${tools.length} tools.`);
