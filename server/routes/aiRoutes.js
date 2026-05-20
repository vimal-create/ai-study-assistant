import express from "express";
import { askQuestion, createFlashcards, createQuiz, createSummary } from "../controllers/aiController.js";

const router = express.Router();

router.post("/ask", askQuestion);
router.post("/summary", createSummary);
router.post("/flashcards", createFlashcards);
router.post("/quiz", createQuiz);

export default router;
