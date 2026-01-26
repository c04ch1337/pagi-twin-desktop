/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PHOENIX_API_URL?: string;
  readonly VITE_MOBILE_PORT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

