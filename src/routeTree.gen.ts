/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

import { Route as rootRouteImport } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as ToolsIndexRouteImport } from './routes/tools/index'
import { Route as ToolsToolNameIndexRouteImport } from './routes/tools/$toolName/index'
import { Route as ToolsToolNameEditRouteImport } from './routes/tools/$toolName/edit'

const IndexRoute = IndexRouteImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRouteImport,
} as any)
const ToolsIndexRoute = ToolsIndexRouteImport.update({
  id: '/tools/',
  path: '/tools/',
  getParentRoute: () => rootRouteImport,
} as any)
const ToolsToolNameIndexRoute = ToolsToolNameIndexRouteImport.update({
  id: '/tools/$toolName/',
  path: '/tools/$toolName/',
  getParentRoute: () => rootRouteImport,
} as any)
const ToolsToolNameEditRoute = ToolsToolNameEditRouteImport.update({
  id: '/tools/$toolName/edit',
  path: '/tools/$toolName/edit',
  getParentRoute: () => rootRouteImport,
} as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/tools': typeof ToolsIndexRoute
  '/tools/$toolName/edit': typeof ToolsToolNameEditRoute
  '/tools/$toolName': typeof ToolsToolNameIndexRoute
}
export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/tools': typeof ToolsIndexRoute
  '/tools/$toolName/edit': typeof ToolsToolNameEditRoute
  '/tools/$toolName': typeof ToolsToolNameIndexRoute
}
export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/': typeof IndexRoute
  '/tools/': typeof ToolsIndexRoute
  '/tools/$toolName/edit': typeof ToolsToolNameEditRoute
  '/tools/$toolName/': typeof ToolsToolNameIndexRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/tools' | '/tools/$toolName/edit' | '/tools/$toolName'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/tools' | '/tools/$toolName/edit' | '/tools/$toolName'
  id:
    | '__root__'
    | '/'
    | '/tools/'
    | '/tools/$toolName/edit'
    | '/tools/$toolName/'
  fileRoutesById: FileRoutesById
}
export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  ToolsIndexRoute: typeof ToolsIndexRoute
  ToolsToolNameEditRoute: typeof ToolsToolNameEditRoute
  ToolsToolNameIndexRoute: typeof ToolsToolNameIndexRoute
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/tools/': {
      id: '/tools/'
      path: '/tools'
      fullPath: '/tools'
      preLoaderRoute: typeof ToolsIndexRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/tools/$toolName/': {
      id: '/tools/$toolName/'
      path: '/tools/$toolName'
      fullPath: '/tools/$toolName'
      preLoaderRoute: typeof ToolsToolNameIndexRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/tools/$toolName/edit': {
      id: '/tools/$toolName/edit'
      path: '/tools/$toolName/edit'
      fullPath: '/tools/$toolName/edit'
      preLoaderRoute: typeof ToolsToolNameEditRouteImport
      parentRoute: typeof rootRouteImport
    }
  }
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  ToolsIndexRoute: ToolsIndexRoute,
  ToolsToolNameEditRoute: ToolsToolNameEditRoute,
  ToolsToolNameIndexRoute: ToolsToolNameIndexRoute,
}
export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()
