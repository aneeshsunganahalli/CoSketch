import http from "http";
import { Server } from "socket.io";
import app from "./index";
import registerSocketHandlers from "./sockets";

const PORT = process.env.PORT || 5000;

// Create HTTP server with Express app
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Register socket handlers
registerSocketHandlers(io);

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 Socket.IO server ready`);
});

export { server, io };