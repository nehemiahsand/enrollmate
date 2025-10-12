import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import enrollmentRoutes from "./routes/enrollmentRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { sequelize } from "./config/db.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/api", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api", courseRoutes);
app.use("/api", enrollmentRoutes);

app.get("/", (req, res) => res.json({ ok: true, msg: "EnrollMate API" }));

// Sync database models (create tables if they don't exist)
sequelize.sync({ alter: false }).then(() => {
  console.log("Database synced (tables created if needed, data preserved)");
});

export default app;
