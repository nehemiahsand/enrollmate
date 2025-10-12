import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import WeeklyTimetable from '../components/WeeklyTimetable'
import { 
  CalendarIcon, 
  PlusIcon, 
  TrashIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'
import { checkCourseConflict } from '../utils/scheduleUtils'

export default function SchedulePreviewPage() {
  const [availableCourses, setAvailableCourses] = useState([])
  const [selectedCourses, setSelectedCourses] = useState([])
  const [currentEnrollments, setCurrentEnrollments] = useState([])
  const [conflicts, setConflicts] = useState([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState(null)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [coursesRes, enrollmentsRes] = await Promise.all([
        api.get('/courses'),
        api.get('/enrollments')
      ])
      
      // Get enrolled courses
      const enrolled = enrollmentsRes.data
        .filter(e => e.status === 'enrolled')
        .map(e => e.Course || e.course)
        .filter(c => c) // Remove null/undefined
      
      setCurrentEnrollments(enrolled)
      
      // Filter out already enrolled courses
      const enrolledIds = enrolled.map(c => c.id)
      const available = coursesRes.data.filter(c => !enrolledIds.includes(c.id))
      
      setAvailableCourses(available)
    } catch (error) {
      console.error('Failed to fetch data:', error)
      showNotification('Failed to load courses', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  const handleAddCourse = (course) => {
    // Check for conflicts with currently enrolled courses + selected courses
    const allCourses = [...currentEnrollments, ...selectedCourses]
    const conflictCheck = checkCourseConflict(course, allCourses)
    
    if (conflictCheck.hasConflict) {
      setConflicts(prev => [...prev, {
        course,
        conflicts: conflictCheck.conflicts
      }])
      showNotification(
        `Schedule conflict detected with ${conflictCheck.conflicts[0].course.name || conflictCheck.conflicts[0].course.title}`,
        'error'
      )
      return
    }
    
    // Add to preview
    setSelectedCourses(prev => [...prev, course])
    setConflicts(prev => prev.filter(c => c.course.id !== course.id))
    showNotification(`Added ${course.name || course.title} to preview`, 'success')
  }

  const handleRemoveCourse = (courseId) => {
    setSelectedCourses(prev => prev.filter(c => c.id !== courseId))
    setConflicts(prev => prev.filter(c => c.course.id !== courseId))
    showNotification('Removed from preview', 'success')
  }

  const handleEnrollSelected = async () => {
    if (selectedCourses.length === 0) {
      showNotification('No courses selected', 'error')
      return
    }

    const successfulEnrollments = []
    const failedEnrollments = []

    for (const course of selectedCourses) {
      try {
        await api.post('/enrollments', { courseId: course.id })
        successfulEnrollments.push(course)
      } catch (error) {
        failedEnrollments.push({
          course,
          error: error.response?.data?.message || 'Enrollment failed'
        })
      }
    }

    if (successfulEnrollments.length > 0) {
      showNotification(
        `Successfully enrolled in ${successfulEnrollments.length} course(s)`,
        'success'
      )
      setTimeout(() => navigate('/dashboard'), 2000)
    }

    if (failedEnrollments.length > 0) {
      showNotification(
        `Failed to enroll in ${failedEnrollments.length} course(s)`,
        'error'
      )
    }
  }

  const handleClearAll = () => {
    setSelectedCourses([])
    setConflicts([])
    showNotification('Preview cleared', 'success')
  }

  // Create preview enrollments for timetable (combining enrolled + selected)
  const previewEnrollments = [
    ...currentEnrollments.map(c => ({
      Course: c,
      status: 'enrolled',
      isExisting: true
    })),
    ...selectedCourses.map(c => ({
      Course: c,
      status: 'preview',
      isExisting: false
    }))
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 rounded-lg shadow-lg p-4 ${
          notification.type === 'success' 
            ? 'bg-green-500' 
            : notification.type === 'error'
            ? 'bg-red-500'
            : 'bg-blue-500'
        } text-white max-w-md`}>
          <div className="flex items-start space-x-3">
            {notification.type === 'success' ? (
              <CheckCircleIcon className="w-6 h-6 flex-shrink-0" />
            ) : notification.type === 'error' ? (
              <XMarkIcon className="w-6 h-6 flex-shrink-0" />
            ) : (
              <ExclamationTriangleIcon className="w-6 h-6 flex-shrink-0" />
            )}
            <p className="flex-1">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <CalendarIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Schedule Preview
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Test different course combinations to build your ideal schedule before enrolling
        </p>
      </div>

      {/* Preview Controls */}
      {selectedCourses.length > 0 && (
        <div className="mb-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                {selectedCourses.length} course(s) selected for preview
              </p>
              <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1">
                Review the schedule below before enrolling
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleClearAll}
                className="px-4 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={handleEnrollSelected}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
              >
                <CheckCircleIcon className="w-4 h-4" />
                <span>Enroll in Selected Courses</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timetable Preview */}
      <div className="mb-8">
        <WeeklyTimetable enrollments={previewEnrollments} />
      </div>

      {/* Conflicts Warning */}
      {conflicts.length > 0 && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                Schedule Conflicts Detected
              </h3>
              {conflicts.map(({ course, conflicts: courseConflicts }) => (
                <div key={course.id} className="text-sm text-red-700 dark:text-red-300 mb-2">
                  <strong>{course.name || course.title}</strong> conflicts with:
                  <ul className="list-disc list-inside ml-4">
                    {courseConflicts.map((conflict, idx) => (
                      <li key={idx}>
                        {conflict.course.name || conflict.course.title} on{' '}
                        {conflict.overlappingDays.join(', ')}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Available Courses */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Available Courses
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableCourses.map(course => {
            const isSelected = selectedCourses.some(c => c.id === course.id)
            const hasConflict = conflicts.some(c => c.course.id === course.id)
            
            return (
              <div
                key={course.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-2 transition-all ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-800'
                    : hasConflict
                    ? 'border-red-500'
                    : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {course.name || course.title}
                  </h3>
                  {isSelected && (
                    <CheckCircleIcon className="w-5 h-5 text-indigo-600" />
                  )}
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {course.description}
                </p>
                
                {course.timeSlot && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 font-medium">
                    📅 {course.timeSlot}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <span>Capacity: {course.enrolledCount || 0}/{course.capacity}</span>
                  <span>{course.credits || 3} credits</span>
                </div>
                
                {isSelected ? (
                  <button
                    onClick={() => handleRemoveCourse(course.id)}
                    className="w-full py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <TrashIcon className="w-4 h-4" />
                    <span>Remove from Preview</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleAddCourse(course)}
                    disabled={hasConflict}
                    className={`w-full py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                      hasConflict
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>Add to Preview</span>
                  </button>
                )}
              </div>
            )
          })}
        </div>
        
        {availableCourses.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No available courses to preview
          </div>
        )}
      </div>
    </div>
  )
}
