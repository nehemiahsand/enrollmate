import { User } from "../src/models/index.js";
import { sequelize } from "../src/config/db.js";

const run = async () => {
  try {
    await User.update({ role: "instructor" }, { where: { id: 2 } });
    await User.update({ role: "admin" }, { where: { id: 3 } });
    console.log("✅ User roles updated successfully:");
    console.log("   - User ID 2: instructor");
    console.log("   - User ID 3: admin");
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error("❌ Error updating roles:", err);
    process.exit(1);
  }
};

run();
