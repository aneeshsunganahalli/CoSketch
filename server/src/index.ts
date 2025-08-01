import express, { Request, Response } from "express";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello from CoSketch");
})

app.listen(PORT, () => {
  console.log("Server running on port ${PORT}");
});