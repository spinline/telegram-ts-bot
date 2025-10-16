import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  // Telegram Web App arayüzünden kullanıcı bilgilerini al
  const user = window.Telegram.WebApp.initDataUnsafe?.user;

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <h1>Telegram Mini App</h1>
      <div className="card">
        <p>
          Bu bir React tabanlı Telegram Mini App.
        </p>
        {user ? (
          <div>
            <h2>Hoş geldin, {user.first_name}!</h2>
            <p>Kullanıcı ID: {user.id}</p>
            <p>Kullanıcı Adı: @{user.username}</p>
          </div>
        ) : (
          <p>Kullanıcı bilgileri yüklenemedi. Lütfen uygulamayı Telegram üzerinden açtığınızdan emin olun.</p>
        )}
      </div>
    </>
  )
}

export default App
