import { createContext, useContext, useState } from 'react'

const AuthContext = createContext()

function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const savedUser = window.sessionStorage.getItem('user')
        return savedUser ? JSON.parse(savedUser) : null
    })

    const login = userData => {
        window.sessionStorage.setItem('token', userData.token)
        window.sessionStorage.setItem('user', JSON.stringify(userData))
        setUser(userData)
    }

    const logout = () => {
        window.sessionStorage.clear()
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}

export default AuthProvider
