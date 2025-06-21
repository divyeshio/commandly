import { createServerFileRoute } from "@tanstack/react-start/server";
import path from "path";
import { promises as fs } from "fs";
import { json } from "@tanstack/react-start";
import { Tool } from "@/lib/types/tool-editor";

export const ServerRoute = createServerFileRoute(
  "/api/tools/$toolName"
).methods({
  GET: async ({ params }) => {
    const collectionDir = path.join(process.cwd(), "collection");
    const toolFilePath = path.join(collectionDir, `${params?.toolName}.json`);
    const file = await fs.readFile(toolFilePath, "utf-8");
    return json(JSON.parse(file) as Tool);
  },
});
