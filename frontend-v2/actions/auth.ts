'use server'

import { validateTelegramWebAppData } from '@/lib/telegram-auth'
import { redirect } from 'next/navigation'

export async function login(initData: string) {
    const validation = validateTelegramWebAppData(initData)
    if (!validation) {
        return { error: 'Invalid initData' }
    }
    // Telegram WebApp tabanlı auth: Session yönetimi yok, sadece doğrulama ve yönlendirme
    redirect('/account')
}

export async function logout() {
    // Telegram WebApp tabanlı auth: Session yönetimi yok, sadece yönlendirme
    redirect('/')
}
