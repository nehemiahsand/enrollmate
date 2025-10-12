import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { createCourse, listCourses, updateCourse, deleteCourse } from "../controllers/courseController.js";
const router = express.Router();

router.get("/courses", authMiddleware, listCourses);
router.post("/courses", authMiddleware, createCourse);
router.put("/courses/:id", authMiddleware, updateCourse);
router.delete("/courses/:id", authMiddleware, deleteCourse);

export default router;
