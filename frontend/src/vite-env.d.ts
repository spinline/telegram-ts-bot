// frontend/src/vite-env.d.ts

/// <reference types="vite/client" />

export {};

declare global {
    // Telegram Web App script'inin eklediği global nesneyi tanımla
    interface TelegramWebAppUser {
        id: number;
        first_name: string;
        last_name?: string;
        username?: string;
    }

    interface TelegramWebApp {
        initData?: string;
        initDataUnsafe?: {
            user?: TelegramWebAppUser;
        };
        colorScheme: 'light' | 'dark';
        ready: () => void;
        openTelegramLink?: (url: string) => void;
        openLink?: (url: string) => void;
    }

    interface Window {
        Telegram: {
            WebApp: TelegramWebApp;
        };
    }
}
