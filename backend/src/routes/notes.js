import { Router } from "express";
import {
  getAll,
  createNote,
  batchCreateNotes,
  updateNote,
  deleteNote,
} from "../controllers/notesController.js";
import Joi from "joi";
import validate from "../middleware/validate.js";

const router = Router();

const noteSchema = Joi.object({
  id: Joi.string().uuid({ version: "uuidv4" }),
  text: Joi.string().min(3).required(),
});

router
  .get("/", getAll)
  .post("/", validate(noteSchema), createNote)
  .post("/batch", validate(Joi.array().items(noteSchema)), batchCreateNotes)
  .put("/", validate(noteSchema), updateNote)
  .delete("/", validate(noteSchema), deleteNote);

export default router;
