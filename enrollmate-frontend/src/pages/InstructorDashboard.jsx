import { useState, useEffect } from 'react'
import api from '../services/api'
import { 
  BookOpenIcon, 
  UsersIcon, 
  AcademicCapIcon,
  ChartBarIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'
import WeeklyTimetable from '../components/WeeklyTimetable'

export default function InstructorDashboard() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [enrolledStudentsModal, setEnrolledStudentsModal] = useState(null)
  const [enrolledStudents, setEnrolledStudents] = useState([])
  const [notification, setNotification] = useState(null)
  const [totalStudents, setTotalStudents] = useState(0)
  const { user } = useAuth()

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      // Fetch courses for current instructor
      const [coursesRes, usersRes] = await Promise.all([
        api.get(`/courses?instructorId=${user?.id || ''}`),
        api.get('/users')
      ])
      
      setCourses(coursesRes.data)
      
      // Count students only (exclude instructors and admins)
      const studentCount = usersRes.data.filter(u => u.role === 'student').length
      setTotalStudents(studentCount)
    } catch (error) {
      console.error('Failed to fetch courses:', error)
      showNotification('Failed to load courses', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchEnrolledStudents = async (courseId) => {
    try {
      const response = await api.get(`/enrollments?courseId=${courseId}`)
      setEnrolledStudents(response.data)
    } catch (error) {
      console.error('Failed to fetch enrolled students:', error)
      showNotification('Failed to load enrolled students', 'error')
    }
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  const handleViewStudents = async (course) => {
    setEnrolledStudentsModal(course)
    await fetchEnrolledStudents(course.id)
  }

  const handleCloseStudentsModal = () => {
    setEnrolledStudentsModal(null)
    setEnrolledStudents([])
  }

  const stats = [
    {
      name: 'Total Courses',
      value: courses.length,
      icon: BookOpenIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Total Students',
      value: totalStudents,
      icon: UsersIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Avg. Enrollment',
      value: courses.length > 0 
        ? Math.round(courses.reduce((sum, course) => sum + (course.enrollmentCount || 0), 0) / courses.length)
        : 0,
      icon: ChartBarIcon,
      color: 'bg-purple-500',
    },
    {
      name: 'Active Courses',
      value: courses.filter(c => (c.enrollmentCount || 0) > 0).length,
      icon: AcademicCapIcon,
      color: 'bg-orange-500',
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Instructor Dashboard 👨‍🏫
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            View your assigned courses and enrolled students
          </p>
        </div>
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

      {/* Courses Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          My Courses
        </h2>

        {courses.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                {/* Course Header */}
                <div className="h-32 bg-gradient-to-br from-primary-500 to-primary-700 p-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <span className="text-xl font-bold text-white">
                          {course.name?.charAt(0) || 'C'}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-white truncate">
                      {course.name}
                    </h3>
                  </div>
                </div>

                {/* Course Body */}
                <div className="p-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                    {course.description || 'No description available'}
                  </p>

                  {/* Enrollment Count */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <UsersIcon className="h-5 w-5 mr-2" />
                      <span className="font-medium">
                        {course.enrollmentCount || 0} {(course.enrollmentCount || 0) === 1 ? 'Student' : 'Students'}
                      </span>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      (course.enrollmentCount || 0) > 0 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {(course.enrollmentCount || 0) > 0 ? 'Active' : 'No Students'}
                    </span>
                  </div>

                  {/* View Students Button */}
                  <button
                    onClick={() => handleViewStudents(course)}
                    disabled={(course.enrollmentCount || 0) === 0}
                    className="w-full flex items-center justify-center px-4 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UsersIcon className="h-4 w-4 mr-2" />
                    View Enrolled Students
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <BookOpenIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No courses assigned yet
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Contact an administrator to be assigned to courses.
            </p>
          </div>
        )}
      </div>

      {/* Weekly Teaching Schedule */}
      {courses.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            My Teaching Schedule 📅
          </h2>
          <WeeklyTimetable courses={courses} />
        </div>
      )}

      {/* Enrolled Students Modal */}
      {enrolledStudentsModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={handleCloseStudentsModal}
            ></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Enrolled Students
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {enrolledStudentsModal.name}
                    </p>
                  </div>
                  <button
                    onClick={handleCloseStudentsModal}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {enrolledStudents.length > 0 ? (
                  <div className="mt-4">
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                              Student Name
                            </th>
                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                              Email
                            </th>
                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                              Enrolled Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                          {enrolledStudents.map((enrollment) => (
                            <tr key={enrollment.id}>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white">
                                {enrollment.User?.name || 'Unknown Student'}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                {enrollment.User?.email || 'N/A'}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                {new Date(enrollment.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No students enrolled</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      No students have enrolled in this course yet.
                    </p>
                  </div>
                )}

                <div className="mt-6">
                  <button
                    onClick={handleCloseStudentsModal}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </button>
                </div>
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
