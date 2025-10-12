import { useState, useEffect } from 'react'
import { ClockIcon, XMarkIcon } from '@heroicons/react/24/outline'
import api from '../services/api'

export default function WeeklyTimetable({ enrollments: propEnrollments, courses: propCourses }) {
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [enrollments, setEnrollments] = useState(propEnrollments || [])
  const [courses, setCourses] = useState(propCourses || [])
  const [loading, setLoading] = useState(!propEnrollments && !propCourses)

  // Fetch enrollments if not provided as prop, and refresh periodically
  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const response = await api.get('/enrollments')
        setEnrollments(response.data)
        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch enrollments:', error)
        setLoading(false)
      }
    }

    // Fetch immediately if no prop enrollments or courses
    if (!propEnrollments && !propCourses) {
      fetchEnrollments()
    } else {
      if (propEnrollments) setEnrollments(propEnrollments)
      if (propCourses) setCourses(propCourses)
    }

    // Set up polling to refresh every 3 seconds (only if not using prop courses)
    let interval
    if (!propCourses) {
      interval = setInterval(fetchEnrollments, 3000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [propEnrollments, propCourses])

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
        </div>
      </div>
    )
  }

  // Days of the week
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const dayAbbrev = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  // Time slots from 8 AM to 8 PM (including half-hour slots)
  const timeSlots = [
    '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
    '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM'
  ]

  // Color palette for courses - Using UAB color scheme
  const colors = [
    'bg-primary-500 hover:bg-primary-600',    // UAB Green
    'bg-accent-500 hover:bg-accent-600',      // UAB Gold
    'bg-primary-600 hover:bg-primary-700',    // Darker UAB Green
    'bg-accent-600 hover:bg-accent-700',      // Darker UAB Gold
    'bg-primary-400 hover:bg-primary-500',    // Lighter UAB Green
    'bg-accent-400 hover:bg-accent-500',      // Lighter UAB Gold
    'bg-primary-700 hover:bg-primary-800',    // Even darker green
    'bg-accent-300 hover:bg-accent-400',      // Light gold
    'bg-primary-300 hover:bg-primary-400',    // Light green
    'bg-accent-700 hover:bg-accent-800'       // Dark gold
  ]

  // Parse time slot string to extract days and times
  const parseTimeSlot = (timeSlot) => {
    if (!timeSlot) return null
    
    // Examples: "MWF 9:00-10:00 AM", "TTh 2:00-3:30 PM", "Mon 10:00 AM-12:00 PM"
    const dayMapping = {
      'M': 'Monday',
      'T': 'Tuesday',
      'W': 'Wednesday',
      'Th': 'Thursday',
      'F': 'Friday',
      'S': 'Saturday',
      'Su': 'Sunday',
      'Mon': 'Monday',
      'Tue': 'Tuesday',
      'Wed': 'Wednesday',
      'Thu': 'Thursday',
      'Fri': 'Friday',
      'Sat': 'Saturday',
      'Sun': 'Sunday'
    }

    try {
      // Split into day pattern and time pattern
      const parts = timeSlot.trim().split(/\s+/)
      if (parts.length < 2) return null

      const dayPattern = parts[0]
      const timePattern = parts.slice(1).join(' ')

      // Parse days
      let courseDays = []
      
      // Handle MWF, TTh, etc.
      if (dayPattern.includes('Th')) {
        // Handle Thursday specially - Process before and after separately
        const parts = dayPattern.split('Th')
        const beforeTh = parts[0]
        const afterTh = parts[1] || ''
        
        // Add days before 'Th'
        for (let char of beforeTh) {
          if (dayMapping[char]) courseDays.push(dayMapping[char])
        }
        
        // Add Thursday
        courseDays.push('Thursday')
        
        // Add days after 'Th'
        for (let char of afterTh) {
          if (dayMapping[char]) courseDays.push(dayMapping[char])
        }
      } else {
        // Try full day names first (Mon, Tue, etc.)
        for (let key in dayMapping) {
          if (key.length > 1 && dayPattern.includes(key)) {
            courseDays.push(dayMapping[key])
          }
        }
        
        // If no full names found, try single letters
        if (courseDays.length === 0) {
          for (let char of dayPattern) {
            if (dayMapping[char]) {
              courseDays.push(dayMapping[char])
            }
          }
        }
      }

      // Parse time
      // Handle formats like "9:00-10:00 AM", "2:00-3:30 PM", "10:00 AM-12:00 PM", "10:30-12:00 PM"
      let startTime = null
      let endTime = null

      // Try to match time patterns
      const timeMatch = timePattern.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i)
      
      if (timeMatch) {
        let [_, startHour, startMin, startPeriod, endHour, endMin, endPeriod] = timeMatch
        
        startHour = parseInt(startHour)
        endHour = parseInt(endHour)
        startMin = startMin
        endMin = endMin

        // If start period not specified, we need to infer it based on the end period and hours
        if (!startPeriod) {
          endPeriod = endPeriod.toUpperCase()
          
          // If end time is AM, start must also be AM
          if (endPeriod === 'AM') {
            startPeriod = 'AM'
          }
          // If end time is PM
          else if (endPeriod === 'PM') {
            // If end is 12:xx PM (noon), start could be AM or PM
            // If start hour is 8-11, it's morning (AM), otherwise PM
            if (endHour === 12) {
              startPeriod = (startHour >= 8 && startHour <= 11) ? 'AM' : 'PM'
            }
            // If end is 1-4 PM and start hour is less than end hour
            // Classes like "1:00-2:00 PM", "2:00-3:30 PM" should both be PM
            // Classes like "10:30-12:00 PM" should be 10:30 AM - 12:00 PM
            else if (endHour >= 1 && endHour <= 4) {
              // If start >= end (like "2:00-3:30"), they're in same period (PM)
              // If start < end but start is typical PM time (1-4), use PM
              // Otherwise use AM (like "10:30-12:00 PM")
              if (startHour >= endHour || (startHour >= 1 && startHour <= 4)) {
                startPeriod = 'PM'
              } else {
                startPeriod = 'AM'
              }
            }
            // For later PM times (5-11 PM), inherit the period
            else {
              startPeriod = 'PM'
            }
          }
        }

        // Convert to 24-hour format
        if (startPeriod && startPeriod.toUpperCase() === 'PM' && startHour !== 12) {
          startHour += 12
        } else if (startPeriod && startPeriod.toUpperCase() === 'AM' && startHour === 12) {
          startHour = 0
        }

        if (endPeriod && endPeriod.toUpperCase() === 'PM' && endHour !== 12) {
          endHour += 12
        } else if (endPeriod && endPeriod.toUpperCase() === 'AM' && endHour === 12) {
          endHour = 0
        }

        startTime = `${startHour}:${startMin}`
        endTime = `${endHour}:${endMin}`
      }

      if (courseDays.length > 0 && startTime && endTime) {
        return { days: courseDays, startTime, endTime }
      }
    } catch (error) {
      console.error('Error parsing time slot:', timeSlot, error)
    }

    return null
  }

  // Convert time string to minutes since midnight for easier comparison
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }

  // Get row span for a course based on duration
  const getRowSpan = (startTime, endTime) => {
    const start = timeToMinutes(startTime)
    const end = timeToMinutes(endTime)
    const duration = end - start
    return Math.ceil(duration / 30) // Each slot is 30 minutes now
  }

  // Get starting row for a course
  const getStartRow = (startTime) => {
    const minutes = timeToMinutes(startTime)
    const startMinutesSince8AM = minutes - (8 * 60) // 8 AM is 480 minutes
    return Math.floor(startMinutesSince8AM / 30) // Each slot is 30 minutes
  }

  // Build timetable data structure - simpler approach
  const timetableData = {}
  const courseColors = {}
  
  // Determine data source: either enrollments or courses
  let dataSource = []
  
  if (courses.length > 0) {
    // Instructor view: use courses directly
    dataSource = courses.map(course => ({ Course: course, course }))
  } else {
    // Student view: filter to only show enrolled courses (not dropped or waitlisted)
    dataSource = enrollments.filter(e => e.status === 'enrolled')
  }
  
  dataSource.forEach((item, index) => {
    const course = item.Course || item.course
    if (!course) return

    // Construct timeSlot from day and time if not present
    const timeSlot = course.timeSlot || `${course.day} ${course.time}`
    
    const parsed = parseTimeSlot(timeSlot)
    if (!parsed) return

    // Assign a color to this course
    courseColors[course.id] = colors[index % colors.length]

    parsed.days.forEach(day => {
      if (!timetableData[day]) {
        timetableData[day] = []
      }

      timetableData[day].push({
        course,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        enrollment: item,
        color: courseColors[course.id]
      })
    })
  })
  
  // Sort courses by start time for each day
  Object.keys(timetableData).forEach(day => {
    timetableData[day].sort((a, b) => {
      return timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    })
  })

  // Format time for display (convert 24-hour to 12-hour)
  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
        <div className="flex items-center space-x-3">
          <ClockIcon className="w-6 h-6 text-white" />
          <h2 className="text-xl font-bold text-white">Weekly Timetable</h2>
        </div>
        <p className="text-primary-100 text-sm mt-1">
          Your class schedule for the week
        </p>
      </div>

      {/* Timetable - Card Layout */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {days.map((day, idx) => (
            <div key={day} className="space-y-3">
              {/* Day Header */}
              <div className="text-center pb-2 border-b-2 border-primary-500">
                <div className="font-bold text-gray-900 dark:text-white">
                  {day}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {dayAbbrev[idx]}
                </div>
              </div>
              
              {/* Courses for this day */}
              <div className="space-y-2 min-h-[200px]">
                {timetableData[day] && timetableData[day].length > 0 ? (
                  timetableData[day].map((item, index) => (
                    <button
                      key={`${day}-${index}`}
                      onClick={() => setSelectedCourse({ course: item.course, enrollment: item.enrollment })}
                      className={`w-full ${item.color} text-white rounded-lg p-3 text-left transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105`}
                    >
                      <div className="text-xs font-bold line-clamp-2 mb-1">
                        {item.course.title}
                      </div>
                      <div className="text-xs opacity-90">
                        {formatTime(item.startTime)} - {formatTime(item.endTime)}
                      </div>
                      {item.course.courseCode && (
                        <div className="text-xs opacity-75 mt-1">
                          {item.course.courseCode}
                        </div>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                    No classes
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {enrollments.length === 0 && (
        <div className="text-center py-12 px-6">
          <ClockIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No courses scheduled
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Enroll in courses to see them on your timetable
          </p>
        </div>
      )}

      {/* Course Detail Modal */}
      {selectedCourse && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedCourse(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {selectedCourse.course.title}
              </h3>
              <button
                onClick={() => setSelectedCourse(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3">
              {selectedCourse.course.courseCode && (
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Course Code:
                  </span>
                  <p className="text-gray-900 dark:text-white">
                    {selectedCourse.course.courseCode}
                  </p>
                </div>
              )}

              {selectedCourse.course.description && (
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Description:
                  </span>
                  <p className="text-gray-900 dark:text-white">
                    {selectedCourse.course.description}
                  </p>
                </div>
              )}

              {selectedCourse.course.instructor && (
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Instructor:
                  </span>
                  <p className="text-gray-900 dark:text-white">
                    {selectedCourse.course.instructor}
                  </p>
                </div>
              )}

              {selectedCourse.course.timeSlot && (
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Schedule:
                  </span>
                  <p className="text-gray-900 dark:text-white">
                    {selectedCourse.course.timeSlot}
                  </p>
                </div>
              )}

              {selectedCourse.course.credits && (
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Credits:
                  </span>
                  <p className="text-gray-900 dark:text-white">
                    {selectedCourse.course.credits}
                  </p>
                </div>
              )}

              {selectedCourse.enrollment.createdAt && (
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Enrolled:
                  </span>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(selectedCourse.enrollment.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedCourse(null)}
              className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <style>{`
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
