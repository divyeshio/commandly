/// <reference types="vite/client" />

declare const COMMIT_SHA: string;

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
