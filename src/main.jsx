import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './assets/scss/style.scss'
import App from './App.jsx'
import { Provider } from 'react-redux'
import { Store } from './lib/store.jsx'
import { recoverByReload } from './lib/error-recovery'

// Also covers dynamic imports outside the router, which no error page would catch.
window.addEventListener('vite:preloadError', (event) => {
  if (recoverByReload()) event.preventDefault()
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={Store}>
      <App />
    </Provider>
  </StrictMode>,
)
