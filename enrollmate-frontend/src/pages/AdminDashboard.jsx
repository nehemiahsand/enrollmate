import { useState, useEffect } from 'react'
import api from '../services/api'
import { 
  UsersIcon, 
  BookOpenIcon, 
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users')
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState(null)
  const { user } = useAuth()

  // Users state
  const [users, setUsers] = useState([])
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('all')
  const [userPage, setUserPage] = useState(1)
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [userFormData, setUserFormData] = useState({ name: '', email: '', password: '', role: 'student' })

  // Courses state
  const [courses, setCourses] = useState([])
  const [courseSearch, setCourseSearch] = useState('')
  const [coursePage, setCoursePage] = useState(1)
  const [courseModalOpen, setCourseModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [courseFormData, setCourseFormData] = useState({ 
    name: '', 
    description: '', 
    instructorId: '', 
    capacity: 30, 
    credits: 3, 
    day: '', 
    time: '' 
  })
  const [selectedDays, setSelectedDays] = useState([])
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  // Logs state
  const [logs, setLogs] = useState([])
  const [logTypeFilter, setLogTypeFilter] = useState('all')
  const [logPage, setLogPage] = useState(1)

  // Assign Professors state
  const [assignSearch, setAssignSearch] = useState('')
  const [assignPage, setAssignPage] = useState(1)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [assigningCourse, setAssigningCourse] = useState(null)
  const [selectedInstructor, setSelectedInstructor] = useState('')

  const itemsPerPage = 10

  useEffect(() => {
    if (activeTab === 'users') fetchUsers()
    if (activeTab === 'courses') {
      fetchCourses()
      // Also fetch users to populate instructor dropdown
      if (users.length === 0) fetchUsers()
    }
    if (activeTab === 'logs') fetchLogs()
    if (activeTab === 'assign') {
      fetchCourses()
      fetchUsers()
    }
  }, [activeTab])

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  // ==================== USERS ====================
  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await api.get('/users')
      setUsers(response.data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
      showNotification('Failed to load users', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = () => {
    setEditingUser(null)
    setUserFormData({ name: '', email: '', password: '', role: 'student' })
    setUserModalOpen(true)
  }

  const handleEditUser = (user) => {
    setEditingUser(user)
    setUserFormData({ name: user.name, email: user.email, password: '', role: user.role || 'student' })
    setUserModalOpen(true)
  }

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"?`)) return

    try {
      await api.delete(`/users/${userId}`)
      setUsers(users.filter(u => u.id !== userId))
      showNotification('User deleted successfully', 'success')
    } catch (error) {
      showNotification(error.response?.data?.error || 'Failed to delete user', 'error')
    }
  }

  const handleSubmitUser = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, userFormData)
        showNotification('User updated successfully', 'success')
      } else {
        await api.post('/register', userFormData)
        showNotification('User created successfully', 'success')
      }
      setUserModalOpen(false)
      fetchUsers()
    } catch (error) {
      showNotification(error.response?.data?.error || 'Failed to save user', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users
    .filter(user => 
      (userRoleFilter === 'all' || user.role === userRoleFilter) &&
      (userSearch === '' || 
        user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.email?.toLowerCase().includes(userSearch.toLowerCase()))
    )

  const paginatedUsers = filteredUsers.slice((userPage - 1) * itemsPerPage, userPage * itemsPerPage)
  const userTotalPages = Math.ceil(filteredUsers.length / itemsPerPage)

  // ==================== COURSES ====================
  const fetchCourses = async () => {
    setLoading(true)
    try {
      const response = await api.get('/courses')
      setCourses(response.data)
    } catch (error) {
      console.error('Failed to fetch courses:', error)
      showNotification('Failed to load courses', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCourse = () => {
    setEditingCourse(null)
    setCourseFormData({ 
      name: '', 
      description: '', 
      instructorId: '', 
      capacity: 30, 
      credits: 3, 
      day: '', 
      time: '' 
    })
    setSelectedDays([])
    setStartTime('')
    setEndTime('')
    setCourseModalOpen(true)
  }

  const handleEditCourse = (course) => {
    setEditingCourse(course)
    
    // Parse existing day data into array
    const dayString = course.day || ''
    const parsedDays = []
    if (dayString.includes('M') && !dayString.includes('Th')) parsedDays.push('M')
    if (dayString.includes('T') && !dayString.includes('Th')) parsedDays.push('T')
    if (dayString.includes('W')) parsedDays.push('W')
    if (dayString.includes('Th')) parsedDays.push('Th')
    if (dayString.includes('F')) parsedDays.push('F')
    setSelectedDays(parsedDays)
    
    // Parse existing time data and convert to 24-hour format for time inputs
    const timeString = course.time || ''
    // Match patterns like "9:00 AM-10:00 AM" or "5:30 PM-7:30 PM"
    const timeMatch = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
    if (timeMatch) {
      const [, startHour, startMin, startAmpm, endHour, endMin, endAmpm] = timeMatch
      
      // Convert to 24-hour format for the time input
      const convert12to24 = (hour, min, ampm) => {
        let h = parseInt(hour)
        if (ampm && ampm.toUpperCase() === 'PM' && h !== 12) h += 12
        if (ampm && ampm.toUpperCase() === 'AM' && h === 12) h = 0
        return `${h.toString().padStart(2, '0')}:${min}`
      }
      
      setStartTime(convert12to24(startHour, startMin, startAmpm || endAmpm))
      setEndTime(convert12to24(endHour, endMin, endAmpm))
    } else {
      setStartTime('')
      setEndTime('')
    }
    
    setCourseFormData({ 
      name: course.title || course.name,
      description: course.description, 
      instructorId: course.instructorId || '',
      capacity: course.capacity || 30,
      credits: course.credits || 3,
      day: course.day || '',
      time: course.time || ''
    })
    setCourseModalOpen(true)
  }

  const handleDeleteCourse = async (courseId, courseName) => {
    if (!confirm(`Are you sure you want to delete course "${courseName}"?`)) return

    try {
      await api.delete(`/courses/${courseId}`)
      setCourses(courses.filter(c => c.id !== courseId))
      showNotification('Course deleted successfully', 'success')
    } catch (error) {
      showNotification(error.response?.data?.error || 'Failed to delete course', 'error')
    }
  }

  const handleSubmitCourse = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Build day string from selected days
      const dayString = selectedDays.join('')
      
      // Convert 24-hour time to 12-hour format with AM/PM
      const formatTime = (time24) => {
        if (!time24) return ''
        const [hours, minutes] = time24.split(':')
        const hour = parseInt(hours)
        const ampm = hour >= 12 ? 'PM' : 'AM'
        const hour12 = hour % 12 || 12
        return `${hour12}:${minutes} ${ampm}`
      }
      
      // Build time string from start and end times
      let timeString = ''
      if (startTime && endTime) {
        const formattedStart = formatTime(startTime)
        const formattedEnd = formatTime(endTime)
        timeString = `${formattedStart}-${formattedEnd}`
      }
      
      // Map 'name' to 'title' for backend compatibility
      const courseData = {
        title: courseFormData.name,
        description: courseFormData.description,
        instructorId: courseFormData.instructorId || undefined,
        capacity: courseFormData.capacity,
        credits: courseFormData.credits,
        day: dayString,
        time: timeString
      }

      if (editingCourse) {
        await api.put(`/courses/${editingCourse.id}`, courseData)
        showNotification('Course updated successfully', 'success')
      } else {
        await api.post('/courses', courseData)
        showNotification('Course created successfully', 'success')
      }
      setCourseModalOpen(false)
      fetchCourses()
    } catch (error) {
      showNotification(error.response?.data?.error || 'Failed to save course', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filteredCourses = courses.filter(course =>
    courseSearch === '' || 
    course.title?.toLowerCase().includes(courseSearch.toLowerCase()) ||
    course.name?.toLowerCase().includes(courseSearch.toLowerCase()) ||
    course.description?.toLowerCase().includes(courseSearch.toLowerCase())
  )

  const paginatedCourses = filteredCourses.slice((coursePage - 1) * itemsPerPage, coursePage * itemsPerPage)
  const courseTotalPages = Math.ceil(filteredCourses.length / itemsPerPage)

  // ==================== LOGS ====================
  const fetchLogs = async () => {
    setLoading(true)
    try {
      // Mock logs data - replace with actual API call
      const mockLogs = [
        { id: 1, type: 'info', message: 'User login successful', timestamp: new Date().toISOString(), user: 'admin@example.com' },
        { id: 2, type: 'warning', message: 'Failed login attempt', timestamp: new Date().toISOString(), user: 'unknown@example.com' },
        { id: 3, type: 'error', message: 'Database connection error', timestamp: new Date().toISOString(), user: 'system' },
        { id: 4, type: 'info', message: 'Course created', timestamp: new Date().toISOString(), user: 'instructor@example.com' },
        { id: 5, type: 'info', message: 'Student enrolled in course', timestamp: new Date().toISOString(), user: 'student@example.com' },
      ]
      setLogs(mockLogs)
    } catch (error) {
      console.error('Failed to fetch logs:', error)
      showNotification('Failed to load logs', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter(log => 
    logTypeFilter === 'all' || log.type === logTypeFilter
  )

  const paginatedLogs = filteredLogs.slice((logPage - 1) * itemsPerPage, logPage * itemsPerPage)
  const logTotalPages = Math.ceil(filteredLogs.length / itemsPerPage)

  // ==================== ASSIGN PROFESSORS ====================
  const handleAssignInstructor = (course) => {
    setAssigningCourse(course)
    setSelectedInstructor(course.instructorId || '')
    setAssignModalOpen(true)
  }

  const handleSubmitAssignment = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api.put(`/courses/${assigningCourse.id}`, {
        instructorId: parseInt(selectedInstructor)
      })
      showNotification('Professor assigned successfully', 'success')
      setAssignModalOpen(false)
      fetchCourses()
    } catch (error) {
      showNotification(error.response?.data?.error || 'Failed to assign professor', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filteredAssignCourses = courses.filter(course =>
    assignSearch === '' || 
    course.title?.toLowerCase().includes(assignSearch.toLowerCase()) ||
    course.name?.toLowerCase().includes(assignSearch.toLowerCase())
  )

  const paginatedAssignCourses = filteredAssignCourses.slice((assignPage - 1) * itemsPerPage, assignPage * itemsPerPage)
  const assignTotalPages = Math.ceil(filteredAssignCourses.length / itemsPerPage)

  const instructors = users.filter(u => u.role === 'instructor')

  const tabs = [
    { id: 'users', name: 'Users', icon: UsersIcon, count: users.length },
    { id: 'courses', name: 'Courses', icon: BookOpenIcon, count: courses.length },
    { id: 'assign', name: 'Assign Professors', icon: AcademicCapIcon, count: instructors.length },
    { id: 'logs', name: 'System Logs', icon: DocumentTextIcon, count: logs.length },
  ]

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-20 right-4 z-50 max-w-md w-full animate-slide-down shadow-lg rounded-lg p-4 ${
          notification.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-start">
            {notification.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mt-0.5 mr-3 flex-shrink-0" />
            ) : (
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            )}
            <p className={`text-sm font-medium ${
              notification.type === 'success' 
                ? 'text-green-800 dark:text-green-300' 
                : 'text-red-800 dark:text-red-300'
            }`}>
              {notification.message}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard ⚙️
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage users, courses, and monitor system activity
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              <tab.icon className={`
                -ml-0.5 mr-2 h-5 w-5
                ${activeTab === tab.id ? 'text-primary-500 dark:text-primary-400' : 'text-gray-400 group-hover:text-gray-500'}
              `} />
              {tab.name}
              <span className={`
                ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium
                ${activeTab === tab.id 
                  ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300' 
                  : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-300'
                }
              `}>
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg">
        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div>
            {/* Toolbar */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
                  {/* Search */}
                  <div className="relative flex-1">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  
                  {/* Role Filter */}
                  <div className="relative">
                    <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
                    >
                      <option value="all">All Roles</option>
                      <option value="student">Students</option>
                      <option value="instructor">Instructors</option>
                      <option value="admin">Admins</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleCreateUser}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add User
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                                <span className="text-primary-700 dark:text-primary-300 font-medium">
                                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize
                            ${user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : ''}
                            ${user.role === 'instructor' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : ''}
                            ${user.role === 'student' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                          `}>
                            {user.role || 'student'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-4"
                          >
                            <PencilIcon className="h-5 w-5 inline" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <TrashIcon className="h-5 w-5 inline" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {userTotalPages > 1 && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-medium">{(userPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(userPage * itemsPerPage, filteredUsers.length)}</span> of{' '}
                  <span className="font-medium">{filteredUsers.length}</span> results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setUserPage(p => Math.max(1, p - 1))}
                    disabled={userPage === 1}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  <span className="px-4 py-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Page {userPage} of {userTotalPages}
                  </span>
                  <button
                    onClick={() => setUserPage(p => Math.min(userTotalPages, p + 1))}
                    disabled={userPage === userTotalPages}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* COURSES TAB */}
        {activeTab === 'courses' && (
          <div>
            {/* Toolbar */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="relative flex-1 w-full">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={handleCreateCourse}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Course
                </button>
              </div>
            </div>

            {/* Courses Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Course Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Instructor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Enrollments
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedCourses.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        No courses found
                      </td>
                    </tr>
                  ) : (
                    paginatedCourses.map((course) => {
                      const instructor = users.find(u => u.id === course.instructorId)
                      return (
                      <tr key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {course.title || course.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                            {course.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {instructor ? (
                            <div className="text-sm">
                              <div className="text-gray-900 dark:text-white font-medium">{instructor.name}</div>
                              <div className="text-gray-500 dark:text-gray-400 text-xs">{instructor.email}</div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-gray-500 italic">Not assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {course.enrollmentCount || 0} students
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {course.createdAt ? new Date(course.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditCourse(course)}
                            className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-4"
                          >
                            <PencilIcon className="h-5 w-5 inline" />
                          </button>
                          <button
                            onClick={() => handleDeleteCourse(course.id, course.title || course.name)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <TrashIcon className="h-5 w-5 inline" />
                          </button>
                        </td>
                      </tr>
                    )})
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {courseTotalPages > 1 && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-medium">{(coursePage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(coursePage * itemsPerPage, filteredCourses.length)}</span> of{' '}
                  <span className="font-medium">{filteredCourses.length}</span> results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCoursePage(p => Math.max(1, p - 1))}
                    disabled={coursePage === 1}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  <span className="px-4 py-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Page {coursePage} of {courseTotalPages}
                  </span>
                  <button
                    onClick={() => setCoursePage(p => Math.min(courseTotalPages, p + 1))}
                    disabled={coursePage === courseTotalPages}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LOGS TAB */}
        {activeTab === 'logs' && (
          <div>
            {/* Toolbar */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <FunnelIcon className="h-5 w-5 text-gray-400" />
                <select
                  value={logTypeFilter}
                  onChange={(e) => setLogTypeFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Logs</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>
            </div>

            {/* Logs Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedLogs.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        No logs found
                      </td>
                    </tr>
                  ) : (
                    paginatedLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize
                            ${log.type === 'info' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : ''}
                            ${log.type === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : ''}
                            ${log.type === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : ''}
                          `}>
                            {log.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">{log.message}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {log.user}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {logTotalPages > 1 && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-medium">{(logPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(logPage * itemsPerPage, filteredLogs.length)}</span> of{' '}
                  <span className="font-medium">{filteredLogs.length}</span> results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLogPage(p => Math.max(1, p - 1))}
                    disabled={logPage === 1}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  <span className="px-4 py-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Page {logPage} of {logTotalPages}
                  </span>
                  <button
                    onClick={() => setLogPage(p => Math.min(logTotalPages, p + 1))}
                    disabled={logPage === logTotalPages}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ASSIGN PROFESSORS TAB */}
        {activeTab === 'assign' && (
          <div>
            {/* Toolbar */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="relative flex-1 w-full">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={assignSearch}
                    onChange={(e) => setAssignSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {instructors.length} instructor{instructors.length !== 1 ? 's' : ''} available
                </div>
              </div>
            </div>

            {/* Courses Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Schedule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Current Professor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Enrollments
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedAssignCourses.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        No courses found
                      </td>
                    </tr>
                  ) : (
                    paginatedAssignCourses.map((course) => {
                      const instructor = users.find(u => u.id === course.instructorId)
                      return (
                        <tr key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {course.title || course.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {course.credits} credits • Capacity: {course.capacity}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {course.day && course.time ? (
                              <div className="text-sm text-gray-900 dark:text-white">
                                <div className="font-medium">{course.day}</div>
                                <div className="text-gray-500 dark:text-gray-400">{course.time}</div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 dark:text-gray-500 italic">Not scheduled</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {instructor ? (
                              <div className="flex items-center">
                                <div className="h-8 w-8 flex-shrink-0">
                                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                    <span className="text-blue-700 dark:text-blue-300 font-medium text-xs">
                                      {instructor.name?.charAt(0)?.toUpperCase() || 'I'}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">{instructor.name}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">{instructor.email}</div>
                                </div>
                              </div>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                Not Assigned
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {course.enrollmentCount || 0} / {course.capacity}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleAssignInstructor(course)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                            >
                              <AcademicCapIcon className="h-4 w-4 mr-1" />
                              {instructor ? 'Reassign' : 'Assign'}
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {assignTotalPages > 1 && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-medium">{(assignPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(assignPage * itemsPerPage, filteredAssignCourses.length)}</span> of{' '}
                  <span className="font-medium">{filteredAssignCourses.length}</span> results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAssignPage(p => Math.max(1, p - 1))}
                    disabled={assignPage === 1}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  <span className="px-4 py-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Page {assignPage} of {assignTotalPages}
                  </span>
                  <button
                    onClick={() => setAssignPage(p => Math.min(assignTotalPages, p + 1))}
                    disabled={assignPage === assignTotalPages}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assign Professor Modal */}
      {assignModalOpen && assigningCourse && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setAssignModalOpen(false)}></div>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Assign Professor to Course
                  </h3>
                  <button onClick={() => setAssignModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Course</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {assigningCourse.title || assigningCourse.name}
                  </p>
                  {(assigningCourse.day || assigningCourse.time) && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {assigningCourse.day} {assigningCourse.time}
                    </p>
                  )}
                </div>

                <form onSubmit={handleSubmitAssignment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Professor <span className="text-red-500">*</span>
                    </label>
                    {instructors.length === 0 ? (
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <div className="flex items-start">
                          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                              No instructors available
                            </p>
                            <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                              You need to create users with the "instructor" role first.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <select
                        required
                        value={selectedInstructor}
                        onChange={(e) => setSelectedInstructor(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">-- Select a professor --</option>
                        {instructors.map((instructor) => (
                          <option key={instructor.id} value={instructor.id}>
                            {instructor.name} ({instructor.email})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setAssignModalOpen(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || instructors.length === 0}
                      className="flex-1 px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Assigning...' : 'Assign Professor'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setUserModalOpen(false)}></div>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {editingUser ? 'Edit User' : 'Create New User'}
                  </h3>
                  <button onClick={() => setUserModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmitUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={userFormData.name}
                      onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={userFormData.email}
                      onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Password {editingUser && '(leave blank to keep current)'}
                    </label>
                    <input
                      type="password"
                      required={!editingUser}
                      value={userFormData.password}
                      onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={userFormData.role}
                      onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="student">Student</option>
                      <option value="instructor">Instructor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setUserModalOpen(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Modal */}
      {courseModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setCourseModalOpen(false)}></div>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {editingCourse ? 'Edit Course' : 'Create New Course'}
                  </h3>
                  <button onClick={() => setCourseModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmitCourse} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Course Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={courseFormData.name}
                      onChange={(e) => setCourseFormData({ ...courseFormData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={courseFormData.description}
                      onChange={(e) => setCourseFormData({ ...courseFormData, description: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Assign Instructor
                    </label>
                    <select
                      value={courseFormData.instructorId}
                      onChange={(e) => setCourseFormData({ ...courseFormData, instructorId: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">No instructor assigned</option>
                      {users.filter(u => u.role === 'instructor').map(instructor => (
                        <option key={instructor.id} value={instructor.id}>
                          {instructor.name} ({instructor.email})
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Select an instructor to teach this course. Only users with instructor role are shown.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Capacity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={courseFormData.capacity}
                        onChange={(e) => setCourseFormData({ ...courseFormData, capacity: parseInt(e.target.value) || 30 })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Credits <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="6"
                        value={courseFormData.credits}
                        onChange={(e) => setCourseFormData({ ...courseFormData, credits: parseInt(e.target.value) || 3 })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Days of Week <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      {[
                        { key: 'M', label: 'M', full: 'Monday' },
                        { key: 'T', label: 'T', full: 'Tuesday' },
                        { key: 'W', label: 'W', full: 'Wednesday' },
                        { key: 'Th', label: 'Th', full: 'Thursday' },
                        { key: 'F', label: 'F', full: 'Friday' }
                      ].map(day => (
                        <button
                          key={day.key}
                          type="button"
                          onClick={() => {
                            setSelectedDays(prev => 
                              prev.includes(day.key) 
                                ? prev.filter(d => d !== day.key)
                                : [...prev, day.key]
                            )
                          }}
                          className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                            selectedDays.includes(day.key)
                              ? 'bg-primary-600 border-primary-600 text-white'
                              : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary-400'
                          }`}
                          title={day.full}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Click to select days this course meets
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Start Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        required
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        End Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        required
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
                    Select the time range this course meets
                  </p>


                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setCourseModalOpen(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Course'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
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
