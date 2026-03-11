import { createIsomorphicFn } from "@tanstack/react-start";
import React from "react";

const clientMdxModules = import.meta.glob<{
  default: React.ComponentType<{ components?: object }>;
}>("../../routes/docs/__collection__/*.mdx");

export const fetchDocComponent = createIsomorphicFn()
  .server(async (componentName: string) => {
    const mdxModules = import.meta.glob<{ default: React.ComponentType<{ components?: object }> }>(
      "../../routes/docs/__collection__/*.mdx",
    );
    const mdxKey = `../../routes/docs/__collection__/${componentName}.mdx`;
    if (!mdxModules[mdxKey]) {
      throw new Error(`Documentation not found for "${componentName}"`);
    }
    const module = await mdxModules[mdxKey]();
    return { component: module.default, componentName };
  })
  .client(async (componentName: string) => {
    const mdxKey = `../../routes/docs/__collection__/${componentName}.mdx`;
    if (!clientMdxModules[mdxKey]) {
      throw new Error(`Documentation not found for "${componentName}"`);
    }
    const module = await clientMdxModules[mdxKey]();
    return { component: module.default, componentName };
  });
