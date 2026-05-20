import express from "express";
import { getNotes, uploadNote } from "../controllers/noteController.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.get("/", getNotes);
router.post("/upload", upload.single("file"), uploadNote);

export default router;
