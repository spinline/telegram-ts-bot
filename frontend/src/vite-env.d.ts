// frontend/src/vite-env.d.ts

/// <reference types="vite/client" />

// Telegram Web App script'inin eklediği global nesneyi tanımla
interface Window {
    Telegram: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        WebApp: any;
    };
}

interface ImportMetaEnv {
    readonly VITE_BACKEND_ORIGIN?: string;
}
interface ImportMeta {
    readonly env: ImportMetaEnv;
}
