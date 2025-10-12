import dotenv from "dotenv";
dotenv.config();
import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";

const PORT = process.env.PORT || 4000;

// Connect to database before starting server
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
});
