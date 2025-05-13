import { Note } from "../../database/models/index.mjs";

const handleConnections = (io) => {
  io.on("connection", (socket) => {
    console.log(`Client connected [id=${socket.id}]`);

    // Handle note creation requests
    socket.on("note:create", async (data) => {
      try {
        console.log("Received note:create event:", data);

        const [note, created] = await Note.findOrCreate({
          where: { id: data.id },
          defaults: {
            text: data.text,
            createdAt: data.createdAt || new Date(),
          },
        });

        // If note exists but text is different, update it
        if (!created && note.text !== data.text) {
          note.text = data.text;
          await note.save();
        }

        // Emit the created/updated note to all clients
        io.emit("note:created", note);

        // Acknowledge receipt to the sender
        socket.emit("note:ack", {
          id: data.id,
          status: "success",
          message: created ? "Note created" : "Note updated",
        });

        console.log(`Note ${created ? "created" : "updated"}: ${note.id}`);
      } catch (error) {
        console.error("Error handling note:create:", error);
        socket.emit("note:error", {
          id: data.id,
          status: "error",
          message: error.message,
        });
      }
    });

    // Handle note update requests
    socket.on("note:update", async (data) => {
      try {
        console.log("Received note:update event:", data);
        const note = await Note.findByPk(data.id);

        if (!note) {
          throw new Error(`Note with ID ${data.id} not found`);
        }

        note.text = data.text;
        note.updatedAt = data.updatedAt || new Date();
        await note.save();

        socket.broadcast.emit("note:updated", note);

        socket.emit("note:update_ack", {
          id: data.id,
          status: "success",
          message: "Note updated",
        });

        console.log(`Note updated: ${note.id}`);
      } catch (error) {
        console.error("Error handling note:update:", error);
        socket.emit("note:error", {
          id: data.id,
          status: "error",
          message: error.message,
        });
      }
    });

    // Handle note deletion requests
    socket.on("note:delete", async (data) => {
      try {
        console.log("Received note:delete event:", data);

        const note = await Note.findByPk(data.id);

        if (!note) {
          throw new Error(`Note with ID ${data.id} not found`);
        }

        await note.destroy();

        io.emit("note:deleted", { id: data.id });

        socket.emit("note:delete_ack", {
          id: data.id,
          status: "success",
          message: "Note deleted",
        });

        console.log(`Note deleted: ${data.id}`);
      } catch (error) {
        console.error("Error handling note:delete:", error);
        socket.emit("note:error", {
          id: data.id,
          status: "error",
          message: error.message,
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected [id=${socket.id}]`);
    });
  });
};

const emitNoteCreated = (io, note) => {
  if (!io) {
    console.error("Socket.io instance not available");
    return;
  }
  console.log("Emitting note:created event:", note.id);
  io.emit("note:created", note); // note:create
};

export { handleConnections, emitNoteCreated };
