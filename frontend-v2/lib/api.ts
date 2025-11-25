
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
    const headers = {
        'Content-Type': 'application/json',
        'x-telegram-init-data': initData,
        ...options.headers,
    }
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    })
    if (response.status === 401) {
        throw new Error('Unauthorized')
    }
    return response
}
