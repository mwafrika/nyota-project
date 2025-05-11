import { Note } from "../../database/models/index.js";
// import { emitNoteCreated } from "../sockets/notesSocket";

const getAll = async (req, res, next) => {
  try {
    const notes = await Note.findAll({ order: [["createdAt", "DESC"]] });
    res.json(notes);
  } catch (err) {
    next(err);
  }
};

export { getAll };
