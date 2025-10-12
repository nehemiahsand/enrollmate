import { sequelize } from "../src/config/db.js";
import models from "../src/models/index.js";

const run = async () => {
  try {
    await sequelize.sync({ alter: false });
    console.log("Database synced (tables created if needed, data preserved)");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
