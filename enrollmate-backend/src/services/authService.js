import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/index.js";

const AuthService = {
  async register({ name, email, password, role }) {
    if (!email || !password || !name) throw new Error("Missing fields");
    const existing = await User.findOne({ where: { email } });
    if (existing) throw new Error("Email already exists");
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash: hash, role });
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "2h" }
    );
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  },

  async login({ email, password }) {
    if (!email || !password) throw new Error("Missing credentials");
    const user = await User.findOne({ where: { email } });
    if (!user) throw new Error("User not found");
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) throw new Error("Invalid credentials");
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "2h" }
    );
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  },
};

export default AuthService;
