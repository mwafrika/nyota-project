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
  io.emit("note:create", note); // note:created
};

export { handleConnections, emitNoteCreated };
