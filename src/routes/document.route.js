import express from "express";
import {
  uploadDocument,
  listDocuments,
  getDocument,
  deleteDocument,
} from "../controllers/document.controller.js";
import { upload } from "../middlewares/upload.middleware.js";
const router = express.Router();

router.post("/upload", upload.single("pdf"), uploadDocument);
router.get("/", listDocuments);
router.get("/:id", getDocument);
router.delete("/:id", deleteDocument);

export default router;
