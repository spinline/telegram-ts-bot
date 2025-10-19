import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
// Mantine stillerini ekle
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';

export function RootApp() {
  const preferredColorScheme = useColorScheme();

  return (
    <MantineProvider defaultColorScheme={preferredColorScheme}>
      <App />
    </MantineProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootApp />
  </StrictMode>,
)
