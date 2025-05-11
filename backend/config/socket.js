const { Server } = require("socket.io");

function initSocket(server) {
  return new Server(server, {
    cors: { origin: process.env.CORS_ORIGIN || "*" },
  });
}

module.exports = { initSocket };
