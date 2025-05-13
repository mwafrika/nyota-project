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

const batchCreateNotes = async (req, res, next) => {
  try {
    const notesArray = req.body;
    const result = [];
    for (const data of notesArray) {
      const [note, created] = await Note.findOrCreate({
        where: { id: data.id },
        defaults: { text: data.text },
      });
      if (!created && note.text !== data.text) {
        note.text = data.text;
        await note.save();
      }
      emitNoteCreated(req.app.locals.io, note);
      result.push(note);
    }
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const updateNote = async (req, res, next) => {
  try {
    const { id, text } = req.body;
    const note = await Note.findByPk(id);
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }
    note.text = text;
    await note.save();
    res.json(note);
  } catch (err) {
    next(err);
  }
};

const deleteNote = async (req, res, next) => {
  try {
    const { id } = req.body;
    const note = await Note.findByPk(id);
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }
    await note.destroy();
    res.json({ message: "Note deleted successfully" });
  } catch (err) {
    next(err);
  }
};

export { getAll, createNote, batchCreateNotes, updateNote, deleteNote };
