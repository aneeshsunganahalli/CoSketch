import express, { Request, Response } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

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
    process.exit(1); // Exit process with failure
  }
};

app.get("/", (req: Request, res: Response) => {
  res.json({message: "Hello from CoSketch"});
});

// Starting server only if database connection established
const startServer = async (): Promise<void> => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});