// IMPORTANT: this must be the first import. ES module imports are evaluated
// depth-first in source order, so loading "dotenv/config" first guarantees
// process.env is populated before app.js / passport.js read keys like
// GOOGLE_CLIENT_ID at module load time.
import "dotenv/config";
import connectDB from "./db/index.js";
import { app } from "./app.js";

const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`⚙️  MyGPT server is running at port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed!", err);
    process.exit(1);
  });
