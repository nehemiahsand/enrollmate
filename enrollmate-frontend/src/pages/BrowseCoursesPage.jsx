import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  AcademicCapIcon,
  ClockIcon,
  BookOpenIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'
import { checkCourseConflict, formatTimeRange } from '../utils/scheduleUtils'

export default function BrowseCoursesPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(null)
  const [notification, setNotification] = useState(null)
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [creditsFilter, setCreditsFilter] = useState('all')
  const [timeSlotFilter, setTimeSlotFilter] = useState('all')
  
  // Enrolled courses for current user (full enrollment objects)
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([])
  const [enrolledCourses, setEnrolledCourses] = useState([])
  
  // Conflict modal state
  const [conflictModal, setConflictModal] = useState(null)

  useEffect(() => {
    fetchCourses()
    fetchEnrolledCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:4000/api/courses', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCourses(response.data)
    } catch (error) {
      console.error('Error fetching courses:', error)
      showNotification('Failed to load courses', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchEnrolledCourses = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:4000/api/enrollments', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const enrolledIds = response.data.map(enrollment => enrollment.course.id)
      setEnrolledCourseIds(enrolledIds)
      setEnrolledCourses(response.data) // Store full enrollment objects for conflict checking
    } catch (error) {
      console.error('Error fetching enrolled courses:', error)
    }
  }

  const handleEnroll = async (courseId, courseName, isFull = false) => {
    if (enrolledCourseIds.includes(courseId)) {
      showNotification('You are already enrolled in this course', 'error')
      return
    }

    // Find the course being enrolled in
    const courseToEnroll = courses.find(c => c.id === courseId)
    if (!courseToEnroll) {
      showNotification('Course not found', 'error')
      return
    }

    // Check for scheduling conflicts
    const conflictCheck = checkCourseConflict(courseToEnroll, enrolledCourses)
    
    if (conflictCheck.hasConflict) {
      // Show conflict modal and block enrollment
      setConflictModal({
        course: courseToEnroll,
        conflicts: conflictCheck.conflicts
      })
      return
    }

    // No conflicts, proceed with enrollment (or waitlist)
    try {
      setEnrolling(courseId)
      const token = localStorage.getItem('token')
      const response = await axios.post(
        'http://localhost:4000/api/enrollments',
        { courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      setEnrolledCourseIds([...enrolledCourseIds, courseId])
      
      // Refresh enrolled courses to include the new one for future conflict checks
      await fetchEnrolledCourses()
      
      // Show appropriate message based on enrollment status
      const enrollmentData = response.data
      if (enrollmentData.status === 'waitlisted') {
        showNotification(
          enrollmentData.message || `Added to waitlist for ${courseName} at position ${enrollmentData.waitlistPosition}`,
          'warning'
        )
      } else {
        showNotification(
          enrollmentData.message || `Successfully enrolled in ${courseName}`,
          'success'
        )
      }
      
      // Refresh courses to update enrollment counts
      await fetchCourses()
    } catch (error) {
      console.error('Error enrolling in course:', error)
      showNotification(error.response?.data?.error || 'Failed to enroll in course', 'error')
    } finally {
      setEnrolling(null)
    }
  }

  const showNotification = (message, type) => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  // Extract unique values for filters
  const departments = [...new Set(courses.map(c => c.department).filter(Boolean))]
  const creditOptions = [...new Set(courses.map(c => c.credits).filter(Boolean))].sort((a, b) => a - b)
  const timeSlots = [...new Set(courses.map(c => c.timeSlot).filter(Boolean))]

  // Filter and search logic
  const filteredCourses = courses.filter(course => {
    const matchesSearch = searchQuery === '' || 
      course.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.courseCode?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesDepartment = departmentFilter === 'all' || course.department === departmentFilter
    const matchesCredits = creditsFilter === 'all' || course.credits === parseInt(creditsFilter)
    const matchesTimeSlot = timeSlotFilter === 'all' || course.timeSlot === timeSlotFilter

    return matchesSearch && matchesDepartment && matchesCredits && matchesTimeSlot
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-slide-down max-w-md">
          <div className={`rounded-lg shadow-lg p-4 flex items-center space-x-3 ${
            notification.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-200' 
              : notification.type === 'warning'
              ? 'bg-yellow-50 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
              : 'bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircleIcon className="w-6 h-6 flex-shrink-0" />
            ) : notification.type === 'warning' ? (
              <ExclamationCircleIcon className="w-6 h-6 flex-shrink-0" />
            ) : (
              <XCircleIcon className="w-6 h-6 flex-shrink-0" />
            )}
            <p className="font-medium">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <BookOpenIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Browse Courses
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Explore and enroll in available courses
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          {/* Search Bar */}
          <div className="mb-4">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Courses
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Search by course name, code, instructor, or description..."
              />
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Department Filter */}
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FunnelIcon className="w-4 h-4 inline mr-1" />
                Department
              </label>
              <select
                id="department"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Credits Filter */}
            <div>
              <label htmlFor="credits" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <AcademicCapIcon className="w-4 h-4 inline mr-1" />
                Credits
              </label>
              <select
                id="credits"
                value={creditsFilter}
                onChange={(e) => setCreditsFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Credits</option>
                {creditOptions.map(credits => (
                  <option key={credits} value={credits}>{credits} Credits</option>
                ))}
              </select>
            </div>

            {/* Time Slot Filter */}
            <div>
              <label htmlFor="timeSlot" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <ClockIcon className="w-4 h-4 inline mr-1" />
                Time Slot
              </label>
              <select
                id="timeSlot"
                value={timeSlotFilter}
                onChange={(e) => setTimeSlotFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Time Slots</option>
                {timeSlots.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters Summary */}
          {(searchQuery || departmentFilter !== 'all' || creditsFilter !== 'all' || timeSlotFilter !== 'all') && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredCourses.length} of {courses.length} courses
              </p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setDepartmentFilter('all')
                  setCreditsFilter('all')
                  setTimeSlotFilter('all')
                }}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredCourses.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <BookOpenIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No courses found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery || departmentFilter !== 'all' || creditsFilter !== 'all' || timeSlotFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No courses are currently available'}
            </p>
            {(searchQuery || departmentFilter !== 'all' || creditsFilter !== 'all' || timeSlotFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setDepartmentFilter('all')
                  setCreditsFilter('all')
                  setTimeSlotFilter('all')
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Course Grid */}
        {!loading && filteredCourses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map(course => {
              const isEnrolled = enrolledCourseIds.includes(course.id)
              const isEnrolling = enrolling === course.id

              return (
                <div
                  key={course.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow duration-200 overflow-hidden flex flex-col"
                >
                  {/* Course Header */}
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {course.courseCode && (
                          <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-white bg-opacity-20 rounded mb-2">
                            {course.courseCode}
                          </span>
                        )}
                        <h3 className="text-lg font-bold text-white line-clamp-2">
                          {course.name}
                        </h3>
                      </div>
                      {isEnrolled && (
                        <CheckCircleIcon className="w-6 h-6 text-white flex-shrink-0 ml-2" />
                      )}
                    </div>
                  </div>

                  {/* Course Content */}
                  <div className="p-4 flex-1 flex flex-col">
                    {/* Description */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 flex-1">
                      {course.description || 'No description available'}
                    </p>

                    {/* Course Details */}
                    <div className="space-y-2 mb-4">
                      {course.instructor && (
                        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                          <UserGroupIcon className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="font-medium">Instructor:</span>
                          <span className="ml-1">{course.instructor}</span>
                        </div>
                      )}
                      
                      {course.department && (
                        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                          <BookOpenIcon className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="font-medium">Department:</span>
                          <span className="ml-1">{course.department}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        {course.credits && (
                          <div className="flex items-center text-gray-700 dark:text-gray-300">
                            <AcademicCapIcon className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="font-medium">{course.credits} Credits</span>
                          </div>
                        )}
                        
                        {course.timeSlot && (
                          <div className="flex items-center text-gray-700 dark:text-gray-300">
                            <ClockIcon className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="font-medium">{course.timeSlot}</span>
                          </div>
                        )}
                      </div>

                      {course.enrollmentCount !== undefined && (
                        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                          <UserGroupIcon className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="font-medium">Enrolled:</span>
                          <span className="ml-1">{course.enrollmentCount} students</span>
                        </div>
                      )}

                      {course.capacity && (
                        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300 mb-2">
                          <span className="font-medium">Capacity:</span>
                          <span className="ml-1">{course.capacity} students</span>
                          {course.enrollmentCount !== undefined && (
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                              ({Math.round((course.enrollmentCount / course.capacity) * 100)}% full)
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Course Full Warning */}
                      {course.capacity && course.enrollmentCount >= course.capacity && !isEnrolled && (
                        <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded">
                          <p className="text-xs text-yellow-800 dark:text-yellow-300 font-medium">
                            ⚠️ Course Full - Join Waitlist Available
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Enroll/Waitlist Button - Role-based rendering */}
                    {user?.role === 'student' ? (
                      <button
                        onClick={() => handleEnroll(course.id, course.name, course.enrollmentCount >= course.capacity)}
                        disabled={isEnrolled || isEnrolling}
                        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                          isEnrolled
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 cursor-default'
                            : isEnrolling
                            ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-wait'
                            : course.capacity && course.enrollmentCount >= course.capacity
                            ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        {isEnrolled ? (
                          <span className="flex items-center justify-center">
                            <CheckCircleIcon className="w-5 h-5 mr-2" />
                            Enrolled
                          </span>
                        ) : isEnrolling ? (
                          <span className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            {course.capacity && course.enrollmentCount >= course.capacity ? 'Joining Waitlist...' : 'Enrolling...'}
                          </span>
                        ) : course.capacity && course.enrollmentCount >= course.capacity ? (
                          <span className="flex items-center justify-center">
                            <ExclamationCircleIcon className="w-5 h-5 mr-2" />
                            Join Waitlist
                          </span>
                        ) : (
                          'Enroll Now'
                        )}
                      </button>
                    ) : user?.role === 'instructor' ? (
                      // Instructors see if they're teaching this course
                      course.instructorId === user?.id ? (
                        <div className="w-full py-2 px-4 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg font-medium text-center border border-green-300 dark:border-green-700">
                          🎓 You teach this course
                        </div>
                      ) : (
                        <div className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg font-medium text-center">
                          View Only
                        </div>
                      )
                    ) : (
                      // Admins can only view
                      <div className="w-full py-2 px-4 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg font-medium text-center border border-blue-300 dark:border-blue-700">
                        👨‍💼 Admin View Only
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Conflict Alert Modal */}
      {conflictModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setConflictModal(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start space-x-3 mb-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  Schedule Conflict Detected
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  The course you're trying to enroll in conflicts with your current schedule
                </p>
              </div>
              <button
                onClick={() => setConflictModal(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Course Attempting to Enroll */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Course you're trying to add:
              </h4>
              <p className="text-lg font-bold text-blue-900 dark:text-blue-300">
                {conflictModal.course.name}
              </p>
              {conflictModal.course.courseCode && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {conflictModal.course.courseCode}
                </p>
              )}
              {conflictModal.course.timeSlot && (
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  <ClockIcon className="w-4 h-4 inline mr-1" />
                  {conflictModal.course.timeSlot}
                </p>
              )}
            </div>

            {/* Conflicting Courses */}
            <div className="space-y-4 mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                Conflicts with:
              </h4>
              {conflictModal.conflicts.map((conflict, index) => (
                <div
                  key={index}
                  className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {conflict.course.name}
                      </p>
                      {conflict.course.courseCode && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {conflict.course.courseCode}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center text-gray-700 dark:text-gray-300">
                      <ClockIcon className="w-4 h-4 mr-2 text-red-500" />
                      <span className="font-medium">Overlapping days:</span>
                      <span className="ml-2">{conflict.overlappingDays.join(', ')}</span>
                    </div>
                    
                    {conflict.course.timeSlot && (
                      <div className="flex items-center text-gray-700 dark:text-gray-300">
                        <ClockIcon className="w-4 h-4 mr-2 text-red-500" />
                        <span className="font-medium">Time:</span>
                        <span className="ml-2">{conflict.course.timeSlot}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Warning Message */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Cannot enroll in this course</p>
                  <p>
                    You must drop one of the conflicting courses before enrolling in this one.
                    Time conflicts are not allowed to ensure you can attend all your classes.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setConflictModal(null)}
                className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
