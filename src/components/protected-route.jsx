import { Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'

export default function ProtectedRoute({ children }) {
    const isLoggedIn = useSelector((state) => state.auth.isLoggedIn)
    const location = useLocation()

    if (!isLoggedIn) {
        // Keep the login URL clean: the page to return to rides in router state.
        return <Navigate to="/login" state={{ returnTo: `${location.pathname}${location.search}` }} replace />
    }
    return children
}
