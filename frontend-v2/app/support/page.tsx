"use client"

import { useEffect, useState } from 'react'
import { fetchWithAuth } from '@/lib/api'
import SupportScreen from '@/components/screens/support-screen'

export default function SupportPage() {
    const [tickets, setTickets] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            try {
                const res = await fetchWithAuth('/tickets')
                if (res.ok) {
                    const data = await res.json()
                    setTickets(data.tickets || [])
                }
            } catch (error) {
                console.error('Error fetching tickets:', error)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    return <SupportScreen initialTickets={tickets} />
}
