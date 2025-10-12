import { useState, useEffect } from 'react'
import { UserCircleIcon, EnvelopeIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

export default function ProfilePage() {
  const { user: authUser, updateUser } = useAuth()
  const [user, setUser] = useState({
    name: '',
    email: '',
    joinedDate: ''
  })
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Get user info from localStorage or API
    const name = localStorage.getItem('userName') || 'User'
    const email = localStorage.getItem('userEmail') || 'user@example.com'
    const joinedDate = localStorage.getItem('joinedDate') || new Date().toISOString()
    
    setUser({ name, email, joinedDate })
    setFormData({ name, email })
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setMessage('') // Clear any previous messages
  }

  const handleSave = async () => {
    if (!authUser?.id) {
      setMessage('User ID not found')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await api.put(`/users/${authUser.id}`, formData)
      
      // Update localStorage
      localStorage.setItem('userName', formData.name)
      localStorage.setItem('userEmail', formData.email)
      
      // Update local state
      setUser(prev => ({ ...prev, name: formData.name, email: formData.email }))
      
      // Update AuthContext - this will update the header
      updateUser({ name: formData.name, email: formData.email })
      
      setMessage('Profile updated successfully!')
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary-500 to-primary-700"></div>
        
        <div className="px-6 pb-6">
          <div className="flex items-end -mt-16 mb-2">
            <div className="w-32 h-32 bg-white dark:bg-gray-700 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center">
              <UserCircleIcon className="w-28 h-28 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
          
          <div className="ml-6 mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
            <p className="text-gray-600 dark:text-gray-400">Student</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <EnvelopeIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-gray-900 dark:text-white">{user.email}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CalendarIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Joined</p>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(user.joinedDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Account Status</p>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Active
                </span>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Role</p>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 capitalize">
                  {authUser?.role || 'Student'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Edit Profile</h3>
        
        {message && (
          <div className={`mb-4 p-3 rounded-lg ${
            message.includes('success') 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-700' 
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-700'
          }`}>
            {message}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Display Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>

          <div className="pt-4">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
