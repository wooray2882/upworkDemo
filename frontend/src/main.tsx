import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './index.css'

// Suppress harmless Chrome browser extension async message channel errors
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && (event.reason.message || typeof event.reason === 'string')) {
    const msg = event.reason.message || event.reason;
    if (typeof msg === 'string' && (
      msg.includes('message channel closed before a response was received') ||
      msg.includes('listener indicated an asynchronous response')
    )) {
      event.preventDefault();
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
