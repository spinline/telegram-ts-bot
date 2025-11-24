import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import WelcomeScreen from './pages/WelcomeScreen'
import AccountPage from './pages/AccountPage'
import SupportScreen from './pages/SupportScreen'
import TicketDetailScreen from './pages/TicketDetailScreen'
import BuySubscription from './pages/BuySubscription'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <div className="dark min-h-screen">
        <AppRoutes />
      </div>
    </BrowserRouter>
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
