import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import passport from "./utils/passport.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "").split(",").map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(cookieParser());
app.use(passport.initialize());

// Serve uploaded images/pdfs statically so the frontend can preview them
app.use("/uploads", express.static(path.resolve("public/uploads")));

app.get("/", (_req, res) => {
  res.json({ message: "MyGPT backend is running 🚀" });
});

/* ------------------------- Routes ------------------------- */
import authRouter from "./routes/auth.routes.js";
import chatRouter from "./routes/chat.routes.js";
import messageRouter from "./routes/message.routes.js";
import fileRouter from "./routes/file.routes.js";
import userRouter from "./routes/user.routes.js";

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/chats", chatRouter);
app.use("/api/v1/messages", messageRouter);
app.use("/api/v1/files", fileRouter);
app.use("/api/v1/users", userRouter);

/* ---------------------- Error handler ---------------------- */
app.use(errorHandler);

export { app };
