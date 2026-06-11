import express from "express";

import { getJobStatus } from "../controllers/job.controller.js";

const router = express.Router();

router.get("/:jobId", getJobStatus);

export default router;
