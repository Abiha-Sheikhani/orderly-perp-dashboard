/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ORDERLY_BROKER_ID?: string;
  readonly VITE_WALLETCONNECT_PROJECT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
