import { useState, useEffect } from 'react'
import api from '../services/api'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { EyeIcon, EyeSlashIcon, ExclamationCircleIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  useEffect(() => {
    // Check for dark mode preference
    const isDark = localStorage.getItem('darkMode') === 'true'
    setDarkMode(isDark)
    if (isDark) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem('darkMode', newDarkMode.toString())
    document.documentElement.classList.toggle('dark')
  }

  const validateForm = () => {
    const errors = {}
    
    if (!email) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    if (!password) {
      errors.password = 'Password is required'
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    try {
      const response = await api.post('/login', { email, password })
      
      // Use AuthContext to handle login
      login(response.data.token, {
        name: response.data.user?.name,
        email: email,
        role: response.data.user?.role
      })
      
      // Redirect based on user role
      const userRole = response.data.user?.role
      let redirectPath = '/dashboard'
      
      if (userRole === 'instructor') {
        redirectPath = '/instructor'
      } else if (userRole === 'admin') {
        redirectPath = '/admin'
      }
      
      // Use the role-based path or the page they were trying to access
      const from = location.state?.from?.pathname || redirectPath
      navigate(from, { replace: true })
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed. Please check your credentials.'
      setError(errorMessage)
      
      // Shake the form on error
      const form = document.getElementById('login-form')
      if (form) {
        form.classList.add('shake')
        setTimeout(() => form.classList.remove('shake'), 500)
      }
    } finally {
      setLoading(false)
    }
  }

  const fillTestCredentials = (testEmail, testPassword) => {
    setEmail(testEmail)
    setPassword(testPassword)
    setError('')
    setFieldErrors({})
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Dark mode toggle - Top right */}
      <button
        onClick={toggleDarkMode}
        className="fixed top-4 right-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all"
        aria-label="Toggle dark mode"
      >
        {darkMode ? (
          <SunIcon className="h-6 w-6 text-yellow-500" />
        ) : (
          <MoonIcon className="h-6 w-6 text-gray-700" />
        )}
      </button>

      <div className="flex flex-1 flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">EnrollMate</h1>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Welcome back</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Sign in to your account to continue
            </p>
          </div>

          <div id="login-form" className="bg-white dark:bg-gray-800 py-8 px-6 shadow-xl rounded-lg transition-colors duration-300">
            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 animate-slide-down">
                <div className="flex items-start">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-500 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                      Login Failed
                    </h3>
                    <p className="mt-1 text-sm text-red-700 dark:text-red-400">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email address <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value)
                    setFieldErrors(prev => ({ ...prev, email: '' }))
                    setError('')
                  }}
                  className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                    fieldErrors.email 
                      ? 'border-red-500 dark:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="you@example.com"
                  disabled={loading}
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value)
                      setFieldErrors(prev => ({ ...prev, password: '' }))
                      setError('')
                    }}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                      fieldErrors.password 
                        ? 'border-red-500 dark:border-red-500' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="••••••••"
                    disabled={loading}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    Don't have an account?
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  to="/register"
                  className="w-full flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all transform active:scale-95"
                >
                  Create an account
                </Link>
              </div>
            </div>

            {/* Test Credentials */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Test Credentials (Click to use)
              </h3>
              <div className="space-y-3 text-xs">
                <button
                  type="button"
                  onClick={() => fillTestCredentials('admin@enrollmate.com', 'admin123')}
                  className="w-full bg-white dark:bg-gray-800 p-2 rounded border border-blue-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all text-left cursor-pointer"
                >
                  <p className="font-medium text-blue-800 dark:text-blue-300 mb-1">👨‍💼 Admin</p>
                  <p className="text-gray-600 dark:text-gray-400 font-mono">admin@enrollmate.com</p>
                  <p className="text-gray-600 dark:text-gray-400 font-mono">admin123</p>
                </button>
                <button
                  type="button"
                  onClick={() => fillTestCredentials('wagner@enrollmate.com', 'teacher123')}
                  className="w-full bg-white dark:bg-gray-800 p-2 rounded border border-blue-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all text-left cursor-pointer"
                >
                  <p className="font-medium text-blue-800 dark:text-blue-300 mb-1">👨‍🏫 Instructor (Dr. Wagner)</p>
                  <p className="text-gray-600 dark:text-gray-400 font-mono">wagner@enrollmate.com</p>
                  <p className="text-gray-600 dark:text-gray-400 font-mono">teacher123</p>
                </button>
                <button
                  type="button"
                  onClick={() => fillTestCredentials('nehemiah@enrollmate.com', 'student123')}
                  className="w-full bg-white dark:bg-gray-800 p-2 rounded border border-blue-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all text-left cursor-pointer"
                >
                  <p className="font-medium text-blue-800 dark:text-blue-300 mb-1">👨‍🎓 Student (Nehemiah Sanders)</p>
                  <p className="text-gray-600 dark:text-gray-400 font-mono">nehemiah@enrollmate.com</p>
                  <p className="text-gray-600 dark:text-gray-400 font-mono">student123</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
          <div className="text-center text-white p-12">
            <h2 className="text-4xl font-bold mb-4">Welcome to EnrollMate</h2>
            <p className="text-xl text-primary-100">Your gateway to seamless course enrollment</p>
            <div className="mt-8 space-y-2">
              <p className="text-primary-200">📚 Browse courses</p>
              <p className="text-primary-200">✅ Easy enrollment</p>
              <p className="text-primary-200">📊 Track your progress</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .shake {
          animation: shake 0.5s;
        }
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
