'use server'

import { validateTelegramWebAppData } from '@/lib/telegram-auth'
import { createSession, deleteSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export async function login(initData: string) {
    const validation = validateTelegramWebAppData(initData)

    if (!validation) {
        return { error: 'Invalid initData' }
    }

    await createSession(validation.user, initData)
    redirect('/account')
}

export async function logout() {
    await deleteSession()
    redirect('/')
}
