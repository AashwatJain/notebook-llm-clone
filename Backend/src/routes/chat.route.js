import express from "express";
import {
  askQuestion,
  history,
  delHistory,
} from "../controllers/chat.controller.js";
import { rateLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = express.Router();

router.post("/ask", rateLimiter, askQuestion);
router.get("/history/:sessionId", history);
router.delete("/history/:sessionId", delHistory);

export default router;
