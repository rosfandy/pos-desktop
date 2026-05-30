import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource-variable/inter'
import './index.css'
import App from './App'

// Log lokasi database (hanya untuk debugging)
if (typeof window !== 'undefined' && (window as any).api?.getDbPath) {
  (window as any).api.getDbPath().then((path: string) => {
    console.log('[DB] Lokasi database:', path);
  }).catch(() => {});
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
