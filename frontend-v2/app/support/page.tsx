import { fetchWithAuth } from '@/lib/api'
import SupportScreen from '@/components/screens/support-screen'

async function getTickets() {
    try {
        const res = await fetchWithAuth('/tickets')
        if (!res.ok) return []
        const data = await res.json()
        return data.tickets || []
    } catch (error) {
        console.error('Error fetching tickets:', error)
        return []
    }
}

export default async function SupportPage() {
    const tickets = await getTickets()
    return <SupportScreen initialTickets={tickets} />
}
