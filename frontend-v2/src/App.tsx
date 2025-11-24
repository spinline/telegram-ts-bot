import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import WelcomeScreen from './pages/WelcomeScreen'
import AccountPage from './pages/AccountPage'
import SupportScreen from './pages/SupportScreen'
import TicketDetailScreen from './pages/TicketDetailScreen'
import BuySubscription from './pages/BuySubscription'
import './index.css'

import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { AppToaster } from './components/ui/toaster'

import { useTelegram } from './hooks/useTelegram'

function App() {
  const { webApp, themeParams } = useTelegram()

  useEffect(() => {
    document.documentElement.classList.add('dark')

    if (webApp) {
      webApp.ready()
      webApp.expand()

      // Apply Telegram theme colors if available
      if (themeParams?.bg_color) {
        document.documentElement.style.setProperty('--tg-theme-bg-color', themeParams.bg_color || null)
        document.documentElement.style.setProperty('--tg-theme-text-color', themeParams.text_color || null)
        document.documentElement.style.setProperty('--tg-theme-hint-color', themeParams.hint_color || null)
        document.documentElement.style.setProperty('--tg-theme-link-color', themeParams.link_color || null)
        document.documentElement.style.setProperty('--tg-theme-button-color', themeParams.button_color || null)
        document.documentElement.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color || null)
        document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', themeParams.secondary_bg_color || null)
      }
    }
  }, [webApp, themeParams])
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="dark min-h-screen">
          <AppRoutes />
          <AppToaster />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

function AppRoutes() {
  const navigate = useNavigate()

  return (
    <Routes>
      <Route path="/" element={
        <WelcomeScreen
          onAccountClick={() => navigate('/account')}
          onSupportClick={() => navigate('/support')}
        />
      } />
      <Route path="/account" element={
        <AccountPage onBack={() => navigate('/')} />
      } />
      <Route path="/support" element={
        <SupportScreen
          onBack={() => navigate('/')}
          onTicketClick={(id) => navigate(`/ticket/${id}`)}
        />
      } />
      <Route path="/ticket/:id" element={
        <TicketDetailWrapper onBack={() => navigate('/support')} />
      } />
      <Route path="/buy" element={
        <BuySubscription onBack={() => navigate('/account')} />
      } />
    </Routes>
  )
}

function TicketDetailWrapper({ onBack }: { onBack: () => void }) {
  const ticketId = 1 // In real app, use useParams()
  return <TicketDetailScreen ticketId={ticketId} onBack={onBack} />
}

export default App
