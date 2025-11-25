"use client"

import { useEffect, useState } from 'react'
import type { TelegramWebApp } from '@/types/telegram'

export function useTelegram() {
    const [webApp, setWebApp] = useState<TelegramWebApp | null>(null)
    const [initData, setInitData] = useState<string | null>(null)
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const app = (window as any).Telegram?.WebApp
        if (app) {
            app.ready()
            setWebApp(app)
            setInitData(app.initData)
            setUser(app.initDataUnsafe?.user)
        }
    }, [])

    const haptic = (style: 'light' | 'medium' | 'heavy' | 'selection' | 'error' | 'success' | 'warning' = 'medium') => {
        if (!webApp) return
        if (style === 'selection') {
            webApp.HapticFeedback.selectionChanged()
        } else if (style === 'error' || style === 'success' || style === 'warning') {
            webApp.HapticFeedback.notificationOccurred(style)
        } else {
            webApp.HapticFeedback.impactOccurred(style as any)
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
        user,
        initData,
        themeParams: webApp?.themeParams,
        haptic,
        showBackButton,
        hideBackButton,
        isExpanded: webApp?.isExpanded,
        viewportHeight: webApp?.viewportHeight,
    }
}
