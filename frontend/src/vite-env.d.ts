// frontend/src/vite-env.d.ts

/// <reference types="vite/client" />

// Telegram Web App script'inin eklediği global nesneyi tanımla
interface Window {
    Telegram: {
        WebApp: any;
    };
}
