import { Navigate } from 'react-router'
import { useAuth } from '../hooks/AuthProvider'

function ProtectedRoute({ roles, children }) {
    const { user } = useAuth()

    if (!user)
        return <Navigate to='/' replace />

    if (roles && !roles.includes(user.role))
        return <Navigate to='/home' replace />

    return children
}

export default ProtectedRoute
