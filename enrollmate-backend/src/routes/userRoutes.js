import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

// Admin-only routes for user management
router.get("/", getAllUsers);
router.get("/:id", getUser);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
