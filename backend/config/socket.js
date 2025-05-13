import { Server } from "socket.io";

function initSocket(server) {
  return new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 10000,
    transports: ["websocket", "polling"],
  });
}

export default initSocket;
