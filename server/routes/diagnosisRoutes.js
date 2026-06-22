import express from "express";
import { analyzeCase, getAssessmentHistory, getClinicalCatalog } from "../controllers/diagnosisController.js";

const router = express.Router();

router.get("/catalog", getClinicalCatalog);
router.get("/history", getAssessmentHistory);
router.post("/analyze", analyzeCase);

export default router;
