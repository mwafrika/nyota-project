import { Router } from "express";
import {
  getAll,
  createNote,
  batchCreateNotes,
} from "../controllers/notesController.js";
import Joi from "joi";
import validate from "../middleware/validate.js";

const router = Router();

const noteSchema = Joi.object({
  id: Joi.string().uuid({ version: "uuidv4" }),
  text: Joi.string().required(),
});

router
  .get("/", getAll)
  .post("/", validate(noteSchema), createNote)
  .post("/batch", validate(Joi.array().items(noteSchema)), batchCreateNotes);

export default router;
