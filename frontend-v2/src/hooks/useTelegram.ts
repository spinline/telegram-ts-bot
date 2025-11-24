import { useEffect, useState } from 'react'
import type { TelegramWebApp } from '../types/telegram'

export function useTelegram() {
    const [webApp, setWebApp] = useState<TelegramWebApp | null>(null)

    useEffect(() => {
        const app = (window as any).Telegram?.WebApp
        if (app) {
            app.ready()
            setWebApp(app)
        } else {
            // Mock for development
            if (import.meta.env.DEV) {
                console.log('Running in DEV mode, using mock Telegram WebApp')
                setWebApp({
                    initDataUnsafe: {
                        user: {
                            id: 123456789,
                            first_name: "Test",
                            last_name: "User",
                            username: "testuser"
                        }
                    },
                    themeParams: {},
                    isExpanded: true,
                    viewportHeight: 800,
                } as any)
            }
        }
    }, [])

    const haptic = (style: 'light' | 'medium' | 'heavy' | 'selection' | 'error' | 'success' | 'warning' = 'medium') => {
        if (style === 'selection') {
            webApp?.HapticFeedback?.selectionChanged?.()
        } else if (style === 'error' || style === 'success' || style === 'warning') {
            webApp?.HapticFeedback?.notificationOccurred?.(style)
        } else {
            webApp?.HapticFeedback?.impactOccurred?.(style)
        }
    }

    const showBackButton = (onClick: () => void) => {
        if (!webApp?.BackButton) return
        webApp.BackButton.show()
        webApp.BackButton.onClick(onClick)
    }

    const hideBackButton = () => {
        if (!webApp?.BackButton) return
        webApp.BackButton.hide()
        webApp.BackButton.offClick(() => { })
    }

    return {
        webApp,
        user: webApp?.initDataUnsafe?.user,
        themeParams: webApp?.themeParams,
        haptic,
        showBackButton,
        hideBackButton,
        isExpanded: webApp?.isExpanded,
        viewportHeight: webApp?.viewportHeight,
    }
}
