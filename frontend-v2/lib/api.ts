import { getSession } from '@/lib/session'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const session = await getSession()

    if (!session?.initData) {
        throw new Error('No session found')
    }

    const headers = {
        'Content-Type': 'application/json',
        'x-telegram-init-data': session.initData as string,
        ...options.headers,
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    })

    if (response.status === 401) {
        // Handle unauthorized (maybe redirect to logout?)
        throw new Error('Unauthorized')
    }

    return response
}
