import express from "express";
import cors from "cors";
import notesRouter from "./routes/notes.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add a test route
app.get("/", (req, res) => {
  res.json({ message: "Backend server is running!" });
});

app.use("/notes", notesRouter);

app.use(errorHandler);

export default app;
