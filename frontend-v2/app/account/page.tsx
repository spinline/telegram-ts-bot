import { fetchWithAuth } from '@/lib/api'
import AccountScreen from '@/components/screens/account-screen'
import { redirect } from 'next/navigation'

async function getAccount() {
    try {
        const res = await fetchWithAuth('/account')
        if (!res.ok) {
            console.error('Failed to fetch account:', res.status, res.statusText)
            return null
        }
        return res.json()
    } catch (error) {
        console.error('Error fetching account:', error)
        return null
    }
}

export default async function AccountPage() {
    const account = await getAccount()

    // If account fetch fails (e.g. 401), we might want to redirect to login or show error
    // For now, we pass null and let the screen handle it (or show demo data)

    return <AccountScreen initialAccount={account} />
}
