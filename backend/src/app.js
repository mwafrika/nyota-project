import express from "express";
import cors from "cors";
import notesRouter from "./routes/notes.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

app.use("/notes", notesRouter);

app.use(errorHandler);

export default app;
