import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  enrollInCourse,
  listEnrollments,
  dropEnrollment,
  getCourseWaitlist,
  getMyWaitlistPosition,
} from "../controllers/enrollmentController.js";
const router = express.Router();

router.post("/enrollments", authMiddleware, enrollInCourse);
router.get("/enrollments", authMiddleware, listEnrollments);
router.put("/enrollments/:id/drop", authMiddleware, dropEnrollment);
router.delete("/enrollments/:id", authMiddleware, dropEnrollment);
router.get("/courses/:courseId/waitlist", authMiddleware, getCourseWaitlist);
router.get(
  "/courses/:courseId/waitlist/my-position",
  authMiddleware,
  getMyWaitlistPosition
);

export default router;
