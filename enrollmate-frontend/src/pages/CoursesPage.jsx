import { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  BookOpenIcon,
  AcademicCapIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

export default function CoursesPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('all') // 'all' or 'enrolled'
  const [courses, setCourses] = useState([])
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [enrollmentIds, setEnrollmentIds] = useState({}) // Map courseId to enrollmentId
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')

  useEffect(() => {
    fetchCourses()
    fetchEnrolledCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses')
      setCourses(response.data)
    } catch (error) {
      console.error('Failed to fetch courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEnrolledCourses = async () => {
    try {
      const response = await api.get('/enrollments')
      const enrolledIds = {}
      const enrolled = []
      response.data.forEach(enrollment => {
        if (enrollment.status === 'enrolled' || enrollment.status === 'waitlisted') {
          enrolledIds[enrollment.courseId] = enrollment.id
          enrolled.push(enrollment.courseId)
        }
      })
      setEnrollmentIds(enrolledIds)
      setEnrolledCourses(enrolled)
    } catch (error) {
      console.error('Failed to fetch enrollments:', error)
    }
  }

  const handleEnroll = async (courseId) => {
    try {
      const response = await api.post('/enrollments', { courseId })
      const enrollment = response.data
      setEnrollmentIds({ ...enrollmentIds, [courseId]: enrollment.id })
      setEnrolledCourses([...enrolledCourses, courseId])
      alert(enrollment.message || 'Successfully enrolled!')
      await fetchCourses() // Refresh to update enrolled count
      await fetchEnrolledCourses() // Refresh enrollments
    } catch (error) {
      alert(error.response?.data?.error || error.response?.data?.message || 'Failed to enroll')
    }
  }

  const handleUnenroll = async (courseId) => {
    try {
      const enrollmentId = enrollmentIds[courseId]
      if (!enrollmentId) {
        alert('Enrollment not found')
        return
      }
      await api.put(`/enrollments/${enrollmentId}/drop`)
      const newEnrollmentIds = { ...enrollmentIds }
      delete newEnrollmentIds[courseId]
      setEnrollmentIds(newEnrollmentIds)
      setEnrolledCourses(enrolledCourses.filter(id => id !== courseId))
      alert('Successfully unenrolled!')
      await fetchCourses() // Refresh to update enrolled count
      await fetchEnrolledCourses() // Refresh enrollments
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to unenroll')
    }
  }

  const isEnrolled = (courseId) => enrolledCourses.includes(courseId)

  // Extract unique departments from courses
  const departments = ['all', ...new Set(courses.map(c => {
    const match = c.title?.match(/^([A-Z]+)\s/)
    return match ? match[1] : 'Other'
  }))]

  // Filter courses based on tab, search, and filters
  const filteredCourses = courses.filter(course => {
    // Tab filter
    if (activeTab === 'enrolled' && !isEnrolled(course.id)) return false
    
    // Search filter
    if (searchQuery && !course.title?.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !course.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    
    // Department filter
    if (departmentFilter !== 'all') {
      const courseDept = course.title?.match(/^([A-Z]+)\s/)
      if (!courseDept || courseDept[1] !== departmentFilter) return false
    }
    
    return true
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Courses</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {activeTab === 'all' ? `${courses.length} courses available` : `${enrolledCourses.length} enrolled courses`}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'all'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <BookOpenIcon className="h-5 w-5" />
              <span>All Courses</span>
              <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs">
                {courses.length}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('enrolled')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'enrolled'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-5 w-5" />
              <span>My Courses</span>
              <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full text-xs">
                {enrolledCourses.length}
              </span>
            </div>
          </button>
        </nav>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        {/* Department Filter */}
        <div className="relative">
          <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white appearance-none cursor-pointer"
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>
                {dept === 'all' ? 'All Departments' : dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div
            key={course.id}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden ${
              isEnrolled(course.id) ? 'ring-2 ring-primary-500' : ''
            }`}
          >
            {/* Course Header */}
            <div className={`h-32 bg-gradient-to-br ${
              isEnrolled(course.id) 
                ? 'from-primary-500 to-primary-700' 
                : 'from-gray-500 to-gray-700'
            } flex items-center justify-center relative`}>
              <span className="text-4xl font-bold text-white opacity-50">
                {course.title?.charAt(0) || 'C'}
              </span>
              {isEnrolled(course.id) && (
                <div className="absolute top-2 right-2 bg-white dark:bg-gray-800 rounded-full p-1">
                  <CheckCircleIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
              )}
            </div>
            
            {/* Course Content */}
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {course.title}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                {course.description}
              </p>

              {/* Course Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <AcademicCapIcon className="h-4 w-4 mr-2" />
                  <span>{course.User?.name || 'TBA'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <ClockIcon className="h-4 w-4 mr-2" />
                  <span>{course.day} {course.time}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <UserGroupIcon className="h-4 w-4 mr-2" />
                  <span>{course.enrolled || 0}/{course.capacity} enrolled</span>
                </div>
                {course.credits && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <BookOpenIcon className="h-4 w-4 mr-2" />
                    <span>{course.credits} credits</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {user?.role === 'student' ? (
                isEnrolled(course.id) ? (
                  <button
                    onClick={() => handleUnenroll(course.id)}
                    className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Drop Course
                  </button>
                ) : (
                  <button
                    onClick={() => handleEnroll(course.id)}
                    className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                    disabled={course.enrolled >= course.capacity}
                  >
                    {course.enrolled >= course.capacity ? 'Course Full' : 'Enroll Now'}
                  </button>
                )
              ) : user?.role === 'instructor' ? (
                course.instructorId === user?.id ? (
                  <div className="w-full py-2 px-4 bg-accent-100 dark:bg-accent-900/30 text-accent-800 dark:text-accent-300 rounded-lg font-medium text-center border border-accent-300 dark:border-accent-700">
                    🎓 You teach this course
                  </div>
                ) : (
                  <div className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg font-medium text-center">
                    View Only
                  </div>
                )
              ) : (
                <div className="w-full py-2 px-4 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 rounded-lg font-medium text-center border border-primary-300 dark:border-primary-700">
                  👨‍💼 Admin View Only
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCourses.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
          <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            {activeTab === 'enrolled' 
              ? "You haven't enrolled in any courses yet." 
              : searchQuery || departmentFilter !== 'all'
              ? "No courses match your search criteria."
              : "No courses available at the moment."}
          </p>
        </div>
      )}
    </div>
  )
}
