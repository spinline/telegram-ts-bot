"use client"

import { useEffect, useState } from 'react'
import { fetchWithAuth } from '@/lib/api'
import AccountScreen from '@/components/screens/account-screen'

export default function AccountPageClient() {
    const [account, setAccount] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true
        async function load() {
            setLoading(true)
            setError(null)
            try {
                const res = await fetchWithAuth('/account')
                console.debug('[AccountPage] fetch /account status=', res.status)
                if (!res.ok) {
                    const text = await res.text().catch(() => '')
                    console.warn('[AccountPage] fetch non-ok:', res.status, text)
                    setError(`API error ${res.status}: ${text}`)
                    setAccount(null)
                } else {
                    const data = await res.json()
                    if (mounted) setAccount(data)
                }
            } catch (err: any) {
                console.error('[AccountPage] fetch error:', err)
                setError(String(err.message || err))
                setAccount(null)
            } finally {
                if (mounted) setLoading(false)
            }
        }

        load()
        return () => {
            mounted = false
        }
    }, [])

    // Pass initialAccount prop as before; the screen will render error when account is null
    return <AccountScreen initialAccount={account} />
}
