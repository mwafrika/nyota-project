import { Router } from "express";
import { getAll } from "../controllers/notesController.js";

const router = Router();

router.get("/", getAll);

export default router;
