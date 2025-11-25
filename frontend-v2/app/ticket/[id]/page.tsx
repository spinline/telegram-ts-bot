"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { fetchWithAuth } from '@/lib/api'
import TicketDetailScreen from '@/components/screens/ticket-detail-screen'

export default function TicketPage() {
    const params = useParams()
    const id = params?.id as string
    const [ticket, setTicket] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!id) return

        async function load() {
            try {
                const res = await fetchWithAuth(`/tickets/${id}`)
                if (res.ok) {
                    const data = await res.json()
                    setTicket(data)
                }
            } catch (error) {
                console.error('Error fetching ticket:', error)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [id])

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Yükleniyor...</div>

    return <TicketDetailScreen ticket={ticket} ticketId={parseInt(id)} />
}
