"use client"

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTelegram } from './useTelegram'

/**
 * Centralizes Telegram Back Button management
 * Automatically shows/hides back button based on current route
 * and handles navigation
 */
export function useBackButton() {
    const router = useRouter()
    const pathname = usePathname()
    const { showBackButton, hideBackButton } = useTelegram()

    useEffect(() => {
        // Define which routes should show back button
        const routes: Record<string, string> = {
            '/account': '/',
            '/support': '/',
            '/buy': '/',
            '/ticket': '/support', // Ticket detail pages
        }

        // Check if current path should show back button
        let targetRoute: string | null = null

        for (const [route, target] of Object.entries(routes)) {
            if (pathname.startsWith(route)) {
                targetRoute = target
                break
            }
        }

        if (targetRoute) {
            // Show back button and set handler
            showBackButton(() => {
                router.push(targetRoute!)
            })
        } else {
            // Hide back button on home page
            hideBackButton()
        }

        // Cleanup on unmount
        return () => {
            hideBackButton()
        }
    }, [pathname, router, showBackButton, hideBackButton])
}
