import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Helper function to decode JWT token
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Error decoding token:', error)
    return null
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      const decoded = decodeToken(storedToken)
      if (decoded) {
        // Check if token is expired
        const currentTime = Date.now() / 1000
        if (decoded.exp && decoded.exp > currentTime) {
          setToken(storedToken)
          setUser({
            id: decoded.id || decoded.userId,
            email: decoded.email,
            name: decoded.name || decoded.username || 'User',
            role: decoded.role || 'student'
          })
        } else {
          // Token expired, clear storage
          localStorage.removeItem('token')
          localStorage.removeItem('userName')
          localStorage.removeItem('userEmail')
        }
      }
    }
    setLoading(false)
  }, [])

  const login = (newToken, userData = null) => {
    // Decode the JWT to get user information
    const decoded = decodeToken(newToken)
    
    if (!decoded) {
      console.error('Failed to decode token')
      return false
    }

    const userInfo = {
      id: userData?.id || decoded.id || decoded.userId,
      email: userData?.email || decoded.email,
      name: userData?.name || decoded.name || decoded.username || 'User',
      role: userData?.role || decoded.role || 'student'
    }

    // Store in state
    setToken(newToken)
    setUser(userInfo)

    // Store in localStorage for persistence
    localStorage.setItem('token', newToken)
    localStorage.setItem('userName', userInfo.name)
    localStorage.setItem('userEmail', userInfo.email)
    
    return true
  }

  const logout = () => {
    // Clear state
    setToken(null)
    setUser(null)

    // Clear localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('userName')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('joinedDate')
  }

  const updateUser = (updatedUserData) => {
    // Update user state with new data
    setUser(prevUser => ({
      ...prevUser,
      ...updatedUserData
    }))

    // Update localStorage
    if (updatedUserData.name) {
      localStorage.setItem('userName', updatedUserData.name)
    }
    if (updatedUserData.email) {
      localStorage.setItem('userEmail', updatedUserData.email)
    }
  }

  const getCurrentUser = () => {
    return user
  }

  const isAuthenticated = () => {
    return !!token && !!user
  }

  const getToken = () => {
    return token
  }

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    getCurrentUser,
    isAuthenticated,
    getToken
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
