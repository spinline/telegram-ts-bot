import { BrowserRouter, Routes, Route } from 'react-router-dom'
import WelcomeScreen from './pages/WelcomeScreen'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <div className="dark min-h-screen bg-background text-foreground">
        <Routes>
          <Route path="/" element={<WelcomeScreen />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
