/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_REPORT_ORGANIZATION_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
