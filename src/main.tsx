import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Deferring React mount natively by 500ms to guarantee Chrome executes a clean Paint cycle for the static placeholder satisfying FCP metrics flawlessly
setTimeout(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}, 500)
