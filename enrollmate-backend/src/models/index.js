import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const User = sequelize.define("User", {
  name: { type: DataTypes.STRING, allowNull:false },
  email: { type: DataTypes.STRING, allowNull:false, unique:true },
  passwordHash: { type: DataTypes.STRING, allowNull:false },
  role: { type: DataTypes.ENUM("student","instructor","admin"), defaultValue: "student" }
});

export const Course = sequelize.define("Course", {
  title: { type: DataTypes.STRING, allowNull:false },
  description: { type: DataTypes.TEXT },
  instructorId: { type: DataTypes.INTEGER, allowNull:false },
  capacity: { type: DataTypes.INTEGER, defaultValue: 30 },
  enrolledCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  day: { type: DataTypes.STRING },
  time: { type: DataTypes.STRING },
  credits: { type: DataTypes.INTEGER, defaultValue:3 },
  active: { type: DataTypes.BOOLEAN, defaultValue:true }
});

export const Enrollment = sequelize.define("Enrollment", {
  studentId: { type: DataTypes.INTEGER, allowNull:false },
  courseId: { type: DataTypes.INTEGER, allowNull:false },
  status: { type: DataTypes.ENUM("enrolled","waitlisted","dropped"), defaultValue: "enrolled" }
});

// Associations
User.hasMany(Course, { foreignKey: "instructorId" });
Course.belongsTo(User, { foreignKey: "instructorId" });

User.hasMany(Enrollment, { foreignKey: "studentId" });
Enrollment.belongsTo(User, { foreignKey: "studentId" });

Course.hasMany(Enrollment, { foreignKey: "courseId" });
Enrollment.belongsTo(Course, { foreignKey: "courseId" });

export default { User, Course, Enrollment };
