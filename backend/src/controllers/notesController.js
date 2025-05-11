import { Note } from "../../database/models/index.mjs";
import { emitNoteCreated } from "../sockets/notesSocket.js";

const getAll = async (req, res, next) => {
  try {
    const notes = await Note.findAll({ order: [["createdAt", "DESC"]] });
    res.json(notes);
  } catch (err) {
    next(err);
  }
};

const createNote = async (req, res, next) => {
  try {
    const { id, text } = req.body;
    const [note, created] = await Note.findOrCreate({
      where: { id },
      defaults: { text },
    });
    if (!created && note.text !== text) {
      note.text = text;
      await note.save();
    }
    emitNoteCreated(req.app.locals.io, note);
    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
};

export { getAll, createNote };
