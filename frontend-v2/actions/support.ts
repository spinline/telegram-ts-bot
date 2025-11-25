'use server'

import { fetchWithAuth } from '@/lib/api'
import { revalidatePath } from 'next/cache'

export type ActionState = {
    error?: string
    success?: boolean
}

export async function createTicket(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const title = formData.get('title') as string
    const message = formData.get('message') as string

    if (!title || !message) {
        return { error: 'Title and message are required' }
    }

    try {
        const res = await fetchWithAuth('/tickets', {
            method: 'POST',
            body: JSON.stringify({ title, message }),
        })

        if (!res.ok) {
            const data = await res.json()
            return { error: data.message || 'Failed to create ticket' }
        }

        revalidatePath('/support')
        return { success: true }
    } catch (error) {
        return { error: 'Failed to create ticket' }
    }
}

export async function sendMessage(ticketId: number, message: string) {
    if (!message) return { error: 'Message is required' }

    try {
        const res = await fetchWithAuth(`/tickets/${ticketId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ message }),
        })

        if (!res.ok) {
            return { error: 'Failed to send message' }
        }

        revalidatePath(`/ticket/${ticketId}`)
        return { success: true }
    } catch (error) {
        return { error: 'Failed to send message' }
    }
}
