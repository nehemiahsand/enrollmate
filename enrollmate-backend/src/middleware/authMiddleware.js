import jwt from "jsonwebtoken";
import { User } from "../models/index.js";

export const authMiddleware = async (req,res,next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ error: "Missing token" });
  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "secret");
    const user = await User.findByPk(payload.id);
    if (!user) return res.status(401).json({ error: "User not found" });
    req.user = { id: user.id, role: user.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};
