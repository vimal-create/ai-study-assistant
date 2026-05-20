import mongoose from "mongoose";
import Note from "../models/Note.js";
import { extractText } from "../utils/pdfExtractor.js";

const memoryNotes = [];

function useDatabase() {
  return mongoose.connection.readyState === 1;
}

export async function uploadNote(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "Please upload a PDF or text file." });
  }

  const content = await extractText(req.file);
  const payload = {
    title: req.file.originalname,
    subject: req.body.subject || "General",
    content: content.trim() || "No readable text found in this file.",
  };

  if (useDatabase()) {
    const note = await Note.create(payload);
    return res.status(201).json(note);
  }

  const note = {
    _id: crypto.randomUUID(),
    ...payload,
    createdAt: new Date().toISOString(),
  };
  memoryNotes.unshift(note);
  return res.status(201).json(note);
}

export async function getNotes(req, res) {
  if (useDatabase()) {
    const notes = await Note.find().sort({ createdAt: -1 }).limit(30);
    return res.json(notes);
  }

  return res.json(memoryNotes);
}
