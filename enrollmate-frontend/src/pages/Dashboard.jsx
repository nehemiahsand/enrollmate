import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { 
  BookOpenIcon, 
  AcademicCapIcon, 
  UsersIcon, 
  ClockIcon,
  PlusIcon,
  EyeIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'
import WeeklyTimetable from '../components/WeeklyTimetable'

export default function Dashboard() {
  const [enrollments, setEnrollments] = useState([])
  const [courses, setCourses] = useState([])
  const [totalStudents, setTotalStudents] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dropLoading, setDropLoading] = useState(null)
  const [notification, setNotification] = useState(null)
  const navigate = useNavigate()
  const { user } = useAuth()

  // Redirect instructors and admins to their respective dashboards
  useEffect(() => {
    if (user?.role === 'instructor') {
      navigate('/instructor', { replace: true })
    } else if (user?.role === 'admin') {
      navigate('/admin', { replace: true })
    }
  }, [user, navigate])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [enrollmentsRes, coursesRes, usersRes] = await Promise.all([
        api.get('/enrollments'),
        api.get('/courses'),
        api.get('/users')
      ])
      // Filter to only show enrolled/waitlisted courses (not dropped)
      const activeEnrollments = enrollmentsRes.data.filter(e => 
        e.status === 'enrolled' || e.status === 'waitlisted'
      )
      setEnrollments(activeEnrollments)
      setCourses(coursesRes.data)
      
      // Count students only (exclude instructors and admins)
      const studentCount = usersRes.data.filter(u => u.role === 'student').length
      setTotalStudents(studentCount)
    } catch (error) {
      console.error('Failed to fetch data:', error)
      showNotification('Failed to load dashboard data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  const handleDropCourse = async (enrollmentId, courseName) => {
    if (!confirm(`Are you sure you want to drop "${courseName}"?`)) {
      return
    }

    setDropLoading(enrollmentId)
    try {
      await api.delete(`/enrollments/${enrollmentId}`)
      setEnrollments(prev => prev.filter(e => e.id !== enrollmentId))
      showNotification(`Successfully dropped "${courseName}"`, 'success')
    } catch (error) {
      showNotification(
        error.response?.data?.error || 'Failed to drop course',
        'error'
      )
    } finally {
      setDropLoading(null)
    }
  }

  const handleViewDetails = (enrollment) => {
    // You can implement a modal or navigate to course detail page
    alert(`Course: ${enrollment.Course?.title}\n\nDescription: ${enrollment.Course?.description}\n\nEnrolled: ${new Date(enrollment.createdAt).toLocaleDateString()}`)
  }

  const stats = [
    {
      name: 'Enrolled Courses',
      value: enrollments.length,
      icon: BookOpenIcon,
      color: 'bg-primary-500',
      bgColor: 'bg-primary-50 dark:bg-primary-900/20',
      textColor: 'text-primary-600 dark:text-primary-400'
    },
    {
      name: 'Available Courses',
      value: courses.length,
      icon: AcademicCapIcon,
      color: 'bg-accent-500',
      bgColor: 'bg-accent-50 dark:bg-accent-900/20',
      textColor: 'text-accent-600 dark:text-accent-400'
    },
    {
      name: 'Total Students',
      value: totalStudents,
      icon: UsersIcon,
      color: 'bg-primary-600',
      bgColor: 'bg-primary-50 dark:bg-primary-900/20',
      textColor: 'text-primary-600 dark:text-primary-400'
    },
    {
      name: 'Credit Hours',
      value: enrollments
        .filter(e => e.status === 'enrolled')
        .reduce((sum, e) => sum + (e.Course?.credits || 0), 0),
      icon: ClockIcon,
      color: 'bg-accent-600',
      bgColor: 'bg-accent-50 dark:bg-accent-900/20',
      textColor: 'text-accent-600 dark:text-accent-400'
    },
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    )
  }

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
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Here's what's happening with your courses today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-gray-800 overflow-hidden shadow-md rounded-lg hover:shadow-lg transition-shadow"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${stat.color} rounded-md p-3`}>
                  <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Weekly Timetable Section */}
      <div className="mt-8">
        <WeeklyTimetable enrollments={enrollments} />
      </div>

      {/* Enrolled Courses Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Enrolled Courses
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {enrollments.length} {enrollments.length === 1 ? 'course' : 'courses'}
          </span>
        </div>

        {enrollments.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((enrollment) => {
              const isWaitlisted = enrollment.status === 'waitlisted';
              const isEnrolled = enrollment.status === 'enrolled';
              
              return (
              <div
                key={enrollment.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                {/* Course Header */}
                <div className={`h-32 ${
                  isWaitlisted 
                    ? 'bg-gradient-to-br from-yellow-500 to-orange-600' 
                    : 'bg-gradient-to-br from-primary-500 to-primary-700'
                } p-6 relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <span className="text-xl font-bold text-white">
                          {enrollment.Course?.title?.charAt(0) || 'C'}
                        </span>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium bg-white/20 backdrop-blur-sm text-white rounded-full ${
                        isWaitlisted ? 'animate-pulse' : ''
                      }`}>
                        {isWaitlisted ? 'Waitlisted' : 'Enrolled'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white truncate">
                      {enrollment.Course?.title || 'Course'}
                    </h3>
                    {isWaitlisted && enrollment.waitlistPosition && (
                      <p className="text-sm text-white/90 mt-1">
                        Position: #{enrollment.waitlistPosition}
                      </p>
                    )}
                  </div>
                </div>

                {/* Course Body */}
                <div className="p-6">
                  {isWaitlisted && (
                    <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded">
                      <p className="text-sm text-yellow-800 dark:text-yellow-300">
                        <strong>Waitlist Position: #{enrollment.waitlistPosition || '?'}</strong>
                        {enrollment.totalWaitlisted && (
                          <span className="block text-xs mt-1">
                            {enrollment.totalWaitlisted} {enrollment.totalWaitlisted === 1 ? 'student' : 'students'} on waitlist
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                    {enrollment.Course?.description || 'No description available'}
                  </p>

                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-4">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    Enrolled {new Date(enrollment.createdAt).toLocaleDateString()}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(enrollment)}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors text-sm font-medium"
                    >
                      <EyeIcon className="h-4 w-4 mr-2" />
                      View Details
                    </button>
                    <button
                      onClick={() => handleDropCourse(enrollment.id, enrollment.Course?.title)}
                      disabled={dropLoading === enrollment.id}
                      className="flex items-center justify-center px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {dropLoading === enrollment.id ? (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <TrashIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <BookOpenIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No courses enrolled yet
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Start your learning journey by browsing and enrolling in available courses.
            </p>
            <button
              onClick={() => navigate('/courses')}
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Browse Courses
            </button>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => navigate('/courses')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group z-40 transform hover:scale-110"
        aria-label="Browse new courses"
      >
        <PlusIcon className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
        <span className="absolute right-16 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Browse Courses
        </span>
      </button>

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
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
