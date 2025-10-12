import { User } from "../models/index.js";
import bcrypt from "bcrypt";

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "name", "email", "role", "createdAt"],
    });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// Get single user
export const getUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ["id", "name", "email", "role", "createdAt"],
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

// Create user (admin only)
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }

    // Check if user already exists
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      passwordHash: hash,
      role: role || "student",
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
};

// Update user (admin can update anyone, users can update their own profile)
export const updateUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const targetUserId = parseInt(req.params.id);
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;

    const user = await User.findByPk(targetUserId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Authorization check: users can only update their own profile unless they're admin
    const isOwnProfile = currentUserId === targetUserId;
    const isAdmin = currentUserRole === "admin";

    if (!isOwnProfile && !isAdmin) {
      return res
        .status(403)
        .json({ error: "You can only update your own profile" });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: "Email already in use" });
      }
    }

    // Update fields
    if (name !== undefined && name.trim() !== "") user.name = name.trim();
    if (email !== undefined && email.trim() !== "") user.email = email.trim();

    // Only admins can change roles
    if (
      role !== undefined &&
      ["student", "instructor", "admin"].includes(role)
    ) {
      if (!isAdmin) {
        return res
          .status(403)
          .json({ error: "Only administrators can change user roles" });
      }
      user.role = role;
    }

    if (password && password.trim() !== "") {
      user.passwordHash = await bcrypt.hash(password, 10);
    }

    await user.save();

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: error.message || "Failed to update user" });
  }
};

// Delete user (admin only)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await user.destroy();
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
};
