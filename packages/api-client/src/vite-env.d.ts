interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly MODE: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_ENABLE_MSW?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
