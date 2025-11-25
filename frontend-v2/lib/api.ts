
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

function getTelegramInitData(): string | null {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initData) {
        return (window as any).Telegram.WebApp.initData
    }
    return null
}

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const initData = getTelegramInitData()
    if (!initData) {
        throw new Error('No Telegram initData found')
    }
    try {
        // Log minimal debug info to help troubleshoot missing backend auth
        // We purposely only print a preview of initData to avoid leaking long secrets in logs
        console.debug('[fetchWithAuth] endpoint=', endpoint, 'API_URL=', API_URL, 'initDataPresent=', !!initData, 'initDataPreview=', String(initData).slice(0, 80))
    } catch (e) {
        // ignore logging errors
    }
    const headers = {
        'Content-Type': 'application/json',
        'x-telegram-init-data': initData,
        ...options.headers,
    }
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    })
    if (!response.ok) {
        // log response details to help debugging
        try {
            const text = await response.text()
            console.warn('[fetchWithAuth] non-ok response', response.status, text)
        } catch (e) {
            console.warn('[fetchWithAuth] non-ok response', response.status)
        }
        if (response.status === 401) {
            throw new Error('Unauthorized')
        }
    }
    return response
}
