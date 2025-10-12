import { Enrollment, Course, User } from "../models/index.js";
import sequelize from "sequelize";
import { formatCourseResponse } from "./courseController.js";

// Helper function to parse time slot and check for conflicts
const parseTimeSlot = (timeSlot) => {
  if (!timeSlot) return null;

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
    const parts = timeSlot.trim().split(/\s+/);
    if (parts.length < 2) return null;

    const dayPattern = parts[0];
    const timePattern = parts.slice(1).join(" ");

    // Parse days
    let courseDays = [];
    if (dayPattern.includes("Th")) {
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
      for (let key in dayMapping) {
        if (key.length > 1 && dayPattern.includes(key)) {
          courseDays.push(dayMapping[key]);
        }
      }
      if (courseDays.length === 0) {
        for (let char of dayPattern) {
          if (dayMapping[char]) courseDays.push(dayMapping[char]);
        }
      }
    }

    // Parse time
    const timeMatch = timePattern.match(
      /(\d{1,2}):(\d{2})\s*(AM|PM)?\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i
    );

    if (timeMatch) {
      let [_, startHour, startMin, startPeriod, endHour, endMin, endPeriod] =
        timeMatch;

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

      const startTime = `${startHour}:${startMin}`;
      const endTime = `${endHour}:${endMin}`;

      if (courseDays.length > 0 && startTime && endTime) {
        return { days: courseDays, startTime, endTime };
      }
    }
  } catch (error) {
    console.error("Error parsing time slot:", timeSlot, error);
  }

  return null;
};

const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

const timesOverlap = (start1, end1, start2, end2) => {
  const start1Min = timeToMinutes(start1);
  const end1Min = timeToMinutes(end1);
  const start2Min = timeToMinutes(start2);
  const end2Min = timeToMinutes(end2);
  return start1Min < end2Min && end1Min > start2Min;
};

const checkScheduleConflict = (newCourse, enrolledCourses) => {
  const newParsed = parseTimeSlot(newCourse.timeSlot);
  if (!newParsed) return null; // Can't check conflict if time slot can't be parsed

  for (let course of enrolledCourses) {
    const enrolledParsed = parseTimeSlot(course.timeSlot);
    if (!enrolledParsed) continue;

    // Check if they share any days
    const sharedDays = newParsed.days.filter((day) =>
      enrolledParsed.days.includes(day)
    );
    if (sharedDays.length > 0) {
      // Check if times overlap
      if (
        timesOverlap(
          newParsed.startTime,
          newParsed.endTime,
          enrolledParsed.startTime,
          enrolledParsed.endTime
        )
      ) {
        return {
          conflictingCourse: course,
          sharedDays: sharedDays,
        };
      }
    }
  }

  return null;
};

export const enrollInCourse = async (req, res) => {
  // Only students can enroll in courses
  if (req.user.role !== "student") {
    return res.status(403).json({
      error: "Only students can enroll in courses",
      message:
        req.user.role === "instructor"
          ? "Instructors are assigned to teach courses by administrators"
          : "Administrators cannot enroll in courses",
    });
  }

  const studentId = req.user.id;
  const { courseId } = req.body;
  const course = await Course.findByPk(courseId);
  if (!course || !course.active)
    return res.status(404).json({ error: "Course not found" });

  // check duplicate
  const existing = await Enrollment.findOne({ where: { studentId, courseId } });
  if (existing && existing.status !== "dropped")
    return res.status(400).json({ error: "Already enrolled or waitlisted" });

  // Check for schedule conflicts with enrolled courses
  const studentEnrollments = await Enrollment.findAll({
    where: {
      studentId,
      status: "enrolled", // Only check against enrolled courses, not waitlisted or dropped
    },
    include: [Course],
  });

  const enrolledCourses = studentEnrollments
    .map((e) => e.Course)
    .filter((c) => c && c.id !== courseId);

  // Combine day and time fields into timeSlot format for conflict checking
  const courseWithTimeSlot = {
    ...course.toJSON(),
    timeSlot: course.day && course.time ? `${course.day} ${course.time}` : null,
  };

  const enrolledCoursesWithTimeSlot = enrolledCourses.map((c) => ({
    ...c.toJSON(),
    timeSlot: c.day && c.time ? `${c.day} ${c.time}` : null,
  }));

  const conflict = checkScheduleConflict(
    courseWithTimeSlot,
    enrolledCoursesWithTimeSlot
  );

  if (conflict) {
    return res.status(409).json({
      error: "Schedule conflict detected",
      message: `This course conflicts with ${
        conflict.conflictingCourse.title || conflict.conflictingCourse.name
      } on ${conflict.sharedDays.join(", ")}`,
      conflictingCourse: {
        id: conflict.conflictingCourse.id,
        name: conflict.conflictingCourse.name,
        timeSlot: conflict.conflictingCourse.timeSlot,
      },
      sharedDays: conflict.sharedDays,
    });
  }

  // check capacity
  if (course.enrolledCount < course.capacity) {
    const enrollment = await Enrollment.create({
      studentId,
      courseId,
      status: "enrolled",
    });
    await course.update({ enrolledCount: course.enrolledCount + 1 });
    return res.status(201).json({
      ...enrollment.toJSON(),
      message: "Successfully enrolled in course",
    });
  } else {
    // Course is full, add to waitlist
    const enrollment = await Enrollment.create({
      studentId,
      courseId,
      status: "waitlisted",
    });

    // Calculate waitlist position
    const waitlistPosition = await Enrollment.count({
      where: {
        courseId,
        status: "waitlisted",
        createdAt: { [sequelize.Op.lte]: enrollment.createdAt },
      },
    });

    return res.status(201).json({
      ...enrollment.toJSON(),
      waitlistPosition,
      message: `Course is full. You have been added to the waitlist at position ${waitlistPosition}.`,
    });
  }
};

export const listEnrollments = async (req, res) => {
  const studentId = req.user.id;
  const { courseId } = req.query;

  // Build query based on user role and parameters
  let whereClause = {};

  // If courseId is provided (instructor viewing students), filter by courseId and enrolled status
  if (courseId) {
    whereClause.courseId = courseId;
    whereClause.status = "enrolled"; // Only show enrolled students, not waitlisted or dropped
  } else {
    // Student viewing their own enrollments
    whereClause.studentId = studentId;
  }

  const enrollments = await Enrollment.findAll({
    where: whereClause,
    include: [Course, { model: User, attributes: ["id", "name", "email"] }],
    order: [["createdAt", "DESC"]],
  });

  // Add waitlist position for waitlisted courses and format Course data
  const enrichedEnrollments = await Promise.all(
    enrollments.map(async (enrollment) => {
      const enrollmentData = enrollment.toJSON();

      // Format the Course data to include enrollmentCount alias
      if (enrollmentData.Course) {
        enrollmentData.Course = formatCourseResponse(enrollmentData.Course);
      }

      if (enrollment.status === "waitlisted") {
        // Calculate current position in waitlist
        const position = await Enrollment.count({
          where: {
            courseId: enrollment.courseId,
            status: "waitlisted",
            createdAt: { [sequelize.Op.lte]: enrollment.createdAt },
          },
        });
        enrollmentData.waitlistPosition = position;

        // Get total waitlist count
        const totalWaitlisted = await Enrollment.count({
          where: {
            courseId: enrollment.courseId,
            status: "waitlisted",
          },
        });
        enrollmentData.totalWaitlisted = totalWaitlisted;
      }

      return enrollmentData;
    })
  );

  res.json(enrichedEnrollments);
};

export const dropEnrollment = async (req, res) => {
  const id = req.params.id;
  const enrollment = await Enrollment.findByPk(id);
  if (!enrollment) return res.status(404).json({ error: "Not found" });
  if (enrollment.studentId !== req.user.id && req.user.role !== "admin")
    return res.status(403).json({ error: "Forbidden" });

  const course = await Course.findByPk(enrollment.courseId);

  // If was enrolled, decrement course count and promote waitlisted student
  if (enrollment.status === "enrolled" && course.enrolledCount > 0) {
    await course.update({ enrolledCount: course.enrolledCount - 1 });

    // Promote the next waitlisted student (oldest first)
    const next = await Enrollment.findOne({
      where: { courseId: course.id, status: "waitlisted" },
      order: [["createdAt", "ASC"]],
    });

    if (next) {
      await next.update({ status: "enrolled" });
      await course.update({ enrolledCount: course.enrolledCount + 1 });

      console.log(
        `Promoted student ${next.studentId} from waitlist to enrolled for course ${course.name}`
      );
      // TODO: Send notification to promoted student (email, in-app notification, etc.)
    }
  }

  // If was waitlisted, just mark as dropped (no need to adjust count)
  await enrollment.update({ status: "dropped" });

  res.json({
    ok: true,
    message:
      enrollment.status === "enrolled"
        ? "Successfully dropped from course"
        : "Removed from waitlist",
  });
};

// New endpoint: Get waitlist information for a specific course
export const getCourseWaitlist = async (req, res) => {
  const { courseId } = req.params;

  const course = await Course.findByPk(courseId);
  if (!course) return res.status(404).json({ error: "Course not found" });

  const waitlistCount = await Enrollment.count({
    where: { courseId, status: "waitlisted" },
  });

  const enrolledCount = course.enrolledCount;
  const capacity = course.capacity;
  const availableSeats = Math.max(0, capacity - enrolledCount);

  res.json({
    courseId: course.id,
    courseName: course.name,
    capacity,
    enrolledCount,
    availableSeats,
    waitlistCount,
    isFull: enrolledCount >= capacity,
  });
};

// New endpoint: Get student's position in waitlist for a specific course
export const getMyWaitlistPosition = async (req, res) => {
  const { courseId } = req.params;
  const studentId = req.user.id;

  const enrollment = await Enrollment.findOne({
    where: { studentId, courseId, status: "waitlisted" },
  });

  if (!enrollment) {
    return res.status(404).json({
      error: "Not found on waitlist",
      message: "You are not currently waitlisted for this course",
    });
  }

  const position = await Enrollment.count({
    where: {
      courseId,
      status: "waitlisted",
      createdAt: { [sequelize.Op.lte]: enrollment.createdAt },
    },
  });

  const totalWaitlisted = await Enrollment.count({
    where: { courseId, status: "waitlisted" },
  });

  res.json({
    courseId,
    position,
    totalWaitlisted,
    enrolledAt: enrollment.createdAt,
  });
};
