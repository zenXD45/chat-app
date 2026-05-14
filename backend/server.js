import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import dotenv from "dotenv";
import path from "path";
import { Server } from "socket.io";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import messageRoutes from "./routes/messages.js";
import { initializeSocket } from "./socket/index.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === "production" ? false : (process.env.FRONTEND_URL || "http://localhost:5173"),
    methods: ["GET", "POST"],
  },
});

app.use(cors({ origin: process.env.NODE_ENV === "production" ? false : (process.env.FRONTEND_URL || "http://localhost:5173") }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

// Database connection
mongoose
  .connect(process.env.MONGODB_URL || "mongodb://localhost:27017/chat-app")
  .then(() => console.log("DB connected successfully"))
  .catch((err) => console.error("DB connection error:", err));

// Setup socket logic
initializeSocket(io);

const __dirname = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("Chat App API is running in development mode...");
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});