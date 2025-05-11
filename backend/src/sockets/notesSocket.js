export const handleConnections = (io) => {
  io.on("connection", (socket) => {
    console.log(`Client connected [id=${socket.id}]`);
    socket.on("disconnect", () => {
      console.log(`Client disconnected [id=${socket.id}]`);
    });
  });
};

export const emitNoteCreated = (io, note) => {
  io.emit("note:created", note);
};

export default {
  handleConnections,
  emitNoteCreated,
};
