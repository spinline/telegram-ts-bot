import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import WelcomeScreen from '@/components/screens/welcome-screen'

export default async function Home() {
  const session = await getSession()

  if (session) {
    redirect('/account')
  }

  return <WelcomeScreen />
}
