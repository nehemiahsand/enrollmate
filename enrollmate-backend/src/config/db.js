import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === "production";

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Parse the database URL to determine dialect
const dialect = DATABASE_URL.startsWith("postgres") ? "postgres" : "sqlite";

export const sequelize = new Sequelize(DATABASE_URL, {
  dialect: dialect,
  dialectOptions:
    dialect === "postgres"
      ? {
          ssl: false, // Disable SSL for local PostgreSQL
        }
      : {},
  logging: !isProduction ? console.log : false,
});

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(
      `${
        dialect === "postgres" ? "PostgreSQL" : "SQLite"
      } connection established successfully.`
    );
  } catch (error) {
    console.error("Unable to connect to database:", error);
    process.exit(1);
  }
};

export default sequelize;
