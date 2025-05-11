import dotenv from "dotenv";
dotenv.config();

import http from "http";
// import { Sequelize } from "sequelize";
// import dbConfigs from "../config/database.js";
import app from "./app.js";
import initSocket from "../config/socket.js";
import { handleConnections } from "./sockets/notesSocket.js";
// import { Note } from "./models/index.js";

// const env = process.env.NODE_ENV || "development";
// const dbConfig = dbConfigs[env];
// const sequelize = new Sequelize(dbConfig);

// Note(sequelize);

(async () => {
  try {
    // await sequelize.authenticate();
    // await sequelize.sync();

    const server = http.createServer(app);
    const io = initSocket(server);
    handleConnections(io);
    app.locals.io = io;

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
  }
})();
