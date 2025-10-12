import { Course, User } from "../models/index.js";

// Helper to format course response with 'name' as alias for 'title'
export const formatCourseResponse = (course) => {
  const courseData = course.toJSON ? course.toJSON() : course;
  return {
    ...courseData,
    name: courseData.title, // Add 'name' as alias for compatibility
    enrollmentCount: courseData.enrolledCount, // Add 'enrollmentCount' as alias for compatibility
    enrolled: courseData.enrolledCount, // Add 'enrolled' as another alias for compatibility
    timeSlot:
      courseData.day && courseData.time
        ? `${courseData.day} ${courseData.time}`
        : null, // Combine day and time
  };
};

export const listCourses = async (req, res) => {
  const { instructorId } = req.query;

  const whereClause = { active: true };

  // Filter by instructorId if provided
  if (instructorId) {
    whereClause.instructorId = instructorId;
  }

  const courses = await Course.findAll({
    where: whereClause,
    include: [
      {
        model: User,
        attributes: ["id", "name", "email"],
      },
    ],
  });
  res.json(courses.map(formatCourseResponse));
};

export const createCourse = async (req, res) => {
  try {
    const {
      title,
      name,
      description,
      capacity,
      day,
      time,
      credits,
      instructorId,
    } = req.body;

    console.log("Create course request body:", req.body);

    // Only instructors or admins can create
    if (!["instructor", "admin"].includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Use 'name' if 'title' is not provided (for compatibility)
    // Check for both undefined and empty string
    const courseTitle = title || name;

    console.log("Course title resolved to:", courseTitle);

    if (
      !courseTitle ||
      (typeof courseTitle === "string" && courseTitle.trim() === "")
    ) {
      return res
        .status(400)
        .json({ error: "Course title or name is required" });
    }

    // If admin provides instructorId, use it; otherwise use current user
    const finalInstructorId =
      req.user.role === "admin" && instructorId ? instructorId : req.user.id;

    const course = await Course.create({
      title: typeof courseTitle === "string" ? courseTitle.trim() : courseTitle,
      description: description || "",
      instructorId: finalInstructorId,
      capacity: capacity || 30,
      day,
      time,
      credits: credits || 3,
    });

    res.status(201).json(formatCourseResponse(course));
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ error: error.message || "Failed to create course" });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const id = req.params.id;
    const {
      title,
      name,
      description,
      capacity,
      day,
      time,
      credits,
      instructorId,
    } = req.body;

    const course = await Course.findByPk(id);
    if (!course) return res.status(404).json({ error: "Not found" });

    // Check permissions: Must be admin OR the course instructor
    const isAdmin = req.user.role === "admin";
    const isOwner = course.instructorId === req.user.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Prepare update data
    const updateData = {};

    // Handle title/name (same as create)
    const courseTitle = title || name;
    if (courseTitle) {
      updateData.title =
        typeof courseTitle === "string" ? courseTitle.trim() : courseTitle;
    }

    if (description !== undefined) updateData.description = description;
    if (capacity !== undefined) updateData.capacity = capacity;
    if (day !== undefined) updateData.day = day;
    if (time !== undefined) updateData.time = time;
    if (credits !== undefined) updateData.credits = credits;

    // Only admin can change instructor
    if (isAdmin && instructorId !== undefined) {
      updateData.instructorId = instructorId;
    }

    await course.update(updateData);
    res.json(formatCourseResponse(course));
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ error: error.message || "Failed to update course" });
  }
};

export const deleteCourse = async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Forbidden" });
  const course = await Course.findByPk(req.params.id);
  if (!course) return res.status(404).json({ error: "Not found" });
  await course.destroy();
  res.json({ ok: true });
};
