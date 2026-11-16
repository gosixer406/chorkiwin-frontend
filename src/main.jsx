import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './assets/scss/style.scss'
import App from './App.jsx'
import { Provider } from 'react-redux'
import { Store } from './lib/store.jsx'
import { recoverByReload } from './lib/error-recovery'
import { prefetchLoginBanner } from './lib/login-banner'

// Also covers dynamic imports outside the router, which no error page would catch.
window.addEventListener('vite:preloadError', (event) => {
  if (recoverByReload()) event.preventDefault()
})

// The login / signup page is often the first one a player opens: start loading
// its banner (and the page code) now so it is cached before they get there.
prefetchLoginBanner()
const warmAuthPages = () => {
  import('./layout/new/auth/index').catch(() => {})
  import('./pages/new/auth/login').catch(() => {})
}
if ('requestIdleCallback' in window) window.requestIdleCallback(warmAuthPages, { timeout: 3000 })
else setTimeout(warmAuthPages, 1500)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={Store}>
      <App />
    </Provider>
  </StrictMode>,
)
