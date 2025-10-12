// Utility functions for detecting course schedule conflicts

// Parse time slot string to extract days and times
export const parseTimeSlot = (timeSlot) => {
  if (!timeSlot) return null;

  // Examples: "MWF 9:00-10:00 AM", "TTh 2:00-3:30 PM", "Mon 10:00 AM-12:00 PM"
  const dayMapping = {
    M: "Monday",
    T: "Tuesday",
    W: "Wednesday",
    Th: "Thursday",
    F: "Friday",
    S: "Saturday",
    Su: "Sunday",
    Mon: "Monday",
    Tue: "Tuesday",
    Wed: "Wednesday",
    Thu: "Thursday",
    Fri: "Friday",
    Sat: "Saturday",
    Sun: "Sunday",
  };

  try {
    // Split into day pattern and time pattern
    const parts = timeSlot.trim().split(/\s+/);
    if (parts.length < 2) return null;

    const dayPattern = parts[0];
    const timePattern = parts.slice(1).join(" ");

    // Parse days
    let courseDays = [];

    // Handle MWF, TTh, etc.
    if (dayPattern.includes("Th")) {
      // Handle Thursday specially
      const beforeTh = dayPattern.split("Th")[0];
      courseDays.push("Thursday");
      for (let char of beforeTh) {
        if (dayMapping[char]) courseDays.push(dayMapping[char]);
      }
      const afterTh = dayPattern.split("Th")[1];
      for (let char of afterTh) {
        if (dayMapping[char]) courseDays.push(dayMapping[char]);
      }
    } else {
      // Try full day names first (Mon, Tue, etc.)
      for (let key in dayMapping) {
        if (key.length > 1 && dayPattern.includes(key)) {
          courseDays.push(dayMapping[key]);
        }
      }

      // If no full names found, try single letters
      if (courseDays.length === 0) {
        for (let char of dayPattern) {
          if (dayMapping[char]) {
            courseDays.push(dayMapping[char]);
          }
        }
      }
    }

    // Parse time
    // Handle formats like "9:00-10:00 AM", "2:00-3:30 PM", "10:00 AM-12:00 PM"
    let startTime = null;
    let endTime = null;

    // Try to match time patterns
    const timeMatch = timePattern.match(
      /(\d{1,2}):(\d{2})\s*(AM|PM)?\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i
    );

    if (timeMatch) {
      let [_, startHour, startMin, startPeriod, endHour, endMin, endPeriod] =
        timeMatch;

      // If start period not specified, inherit from end period
      if (!startPeriod) startPeriod = endPeriod;

      startHour = parseInt(startHour);
      endHour = parseInt(endHour);

      // Convert to 24-hour format
      if (
        startPeriod &&
        startPeriod.toUpperCase() === "PM" &&
        startHour !== 12
      ) {
        startHour += 12;
      } else if (
        startPeriod &&
        startPeriod.toUpperCase() === "AM" &&
        startHour === 12
      ) {
        startHour = 0;
      }

      if (endPeriod && endPeriod.toUpperCase() === "PM" && endHour !== 12) {
        endHour += 12;
      } else if (
        endPeriod &&
        endPeriod.toUpperCase() === "AM" &&
        endHour === 12
      ) {
        endHour = 0;
      }

      startTime = `${startHour}:${startMin}`;
      endTime = `${endHour}:${endMin}`;
    }

    if (courseDays.length > 0 && startTime && endTime) {
      return { days: courseDays, startTime, endTime };
    }
  } catch (error) {
    console.error("Error parsing time slot:", timeSlot, error);
  }

  return null;
};

// Convert time string (HH:MM in 24-hour format) to minutes since midnight
export const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

// Check if two time ranges overlap
export const timesOverlap = (start1, end1, start2, end2) => {
  const start1Min = timeToMinutes(start1);
  const end1Min = timeToMinutes(end1);
  const start2Min = timeToMinutes(start2);
  const end2Min = timeToMinutes(end2);

  // Two ranges overlap if:
  // - start1 is before end2 AND end1 is after start2
  return start1Min < end2Min && end1Min > start2Min;
};

// Check if two courses have overlapping days
export const daysOverlap = (days1, days2) => {
  return days1.some((day) => days2.includes(day));
};

// Check if a new course conflicts with existing enrolled courses
export const checkCourseConflict = (newCourse, enrolledCourses) => {
  const newParsed = parseTimeSlot(newCourse.timeSlot);

  if (!newParsed) {
    // Can't parse the time slot, so we can't check for conflicts
    // Allow enrollment but warn about unparseable time slot
    return {
      hasConflict: false,
      conflicts: [],
    };
  }

  const conflicts = [];

  for (let enrollment of enrolledCourses) {
    const course = enrollment.Course || enrollment.course;
    if (!course) continue;

    const enrolledParsed = parseTimeSlot(course.timeSlot);
    if (!enrolledParsed) continue;

    // Check if they share any days
    if (daysOverlap(newParsed.days, enrolledParsed.days)) {
      // Check if the times overlap
      if (
        timesOverlap(
          newParsed.startTime,
          newParsed.endTime,
          enrolledParsed.startTime,
          enrolledParsed.endTime
        )
      ) {
        // Find the overlapping days
        const overlappingDays = newParsed.days.filter((day) =>
          enrolledParsed.days.includes(day)
        );

        conflicts.push({
          course: course,
          overlappingDays: overlappingDays,
          newCourseTime: `${newParsed.startTime}-${newParsed.endTime}`,
          existingCourseTime: `${enrolledParsed.startTime}-${enrolledParsed.endTime}`,
        });
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts: conflicts,
  };
};

// Format time for display (convert 24-hour to 12-hour)
export const formatTime = (time24) => {
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
};

// Format time range for display
export const formatTimeRange = (startTime, endTime) => {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
};
