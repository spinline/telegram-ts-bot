import { fetchWithAuth } from '@/lib/api'
import TicketDetailScreen from '@/components/screens/ticket-detail-screen'

async function getTicket(id: string) {
    try {
        const res = await fetchWithAuth(`/tickets/${id}`)
        if (!res.ok) return null
        return res.json()
    } catch (error) {
        console.error('Error fetching ticket:', error)
        return null
    }
}

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const ticket = await getTicket(id)

    return <TicketDetailScreen ticket={ticket} ticketId={parseInt(id)} />
}
