import { asyncHandler } from "../utils/asyncHandler.js";
import { Document } from "../models/document.model.js";
import { Chunk } from "../models/chunks.model.js";
import { ApiError } from "../utils/ApiError.js";
import { JOB_TTL } from "../utils/constants.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { redis } from "../config/redis.js";
import crypto from "crypto";

const uploadDocument = asyncHandler(async (req, res) => {
  const filePath = req.file?.path;

  if (!filePath) {
    throw new ApiError(400, "PDF is missing");
  }

  const document = await Document.create({
    fileName: req.file.filename,
    originalName: req.file.originalname,
    fileSize: req.file.size,
  });

  const jobId = crypto.randomUUID();

  await redis.hset(`job:${jobId}`, {
    status: "queued",
    documentId: document._id.toString(),
    startedAt: new Date().toISOString(),
  });

  await redis.expire(`job:${jobId}`, JOB_TTL);

  await redis.lpush(
    "ingestion:queue",
    JSON.stringify({
      documentId: document._id,
      filePath: req.file.path,
      jobId,
    }),
  );

  res.status(202).json(
    new ApiResponse(
      202,
      {
        documentId: document._id,
        jobId,
      },
      "PDF accepted for processing",
    ),
  );
});

const listDocuments = asyncHandler(async (req, res) => {
  const documents = await Document.find().sort({ createdAt: -1 });
  res
    .status(200)
    .json(new ApiResponse(200, { documents }, "All documents retrieved"));
});

const getDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const document = await Document.findById(id);

  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, { document }, "Document retrieved"));
});

const deleteDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const document = await Document.findByIdAndDelete(id);

  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  await Chunk.deleteMany({ documentId: id });

  res.status(200).json(new ApiResponse(200, {}, "Document deleted"));
});

export { uploadDocument, listDocuments, getDocument, deleteDocument };
