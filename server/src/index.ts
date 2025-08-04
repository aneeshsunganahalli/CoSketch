import express, { Request, Response } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.route";
import roomRouter from "./routes/room.route";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));

// Database Connection Function
const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGO;
    if (!mongoURI) {
      throw new Error("MONGO environment variable is not defined");
    }
    
    await mongoose.connect(mongoURI);
    console.log("✅ Database Connected Successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
};

// Routes
app.get("/", (req: Request, res: Response) => {
  res.json({message: "Hello from CoSketch"});
});

app.use('/auth', authRouter);
app.use('/api/rooms', roomRouter);

// Initialize database connection
connectDB();

export default app;