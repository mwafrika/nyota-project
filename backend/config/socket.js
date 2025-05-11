import { Server } from "socket.io";

function initSocket(server) {
  return new Server(server, {
    cors: { origin: process.env.CORS_ORIGIN || "*" },
  });
}

export default initSocket;
