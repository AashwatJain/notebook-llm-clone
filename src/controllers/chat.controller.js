import { Document } from "../models/document.model.js";
import { generateEmbeddings } from "../services/embedding.service.js";
import { buildPrompt, streamAnswer } from "../services/llm.service.js";
import { searchChunks } from "../services/retrieval.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const askQuestion = asyncHandler(async (req, res) => {
  const { question, sessionId, documentId } = req.body;

  if (!documentId || !sessionId || !question || question.trim() === "")
    throw new ApiError(400, "All fields are req");

  const document = await Document.findById(documentId);

  if (!document) throw new ApiError(404, "Document not found");

  if (document.status === "failed")
    throw new ApiError(400, "Document processing failed. Please re-upload");

  if (document.status === "processing")
    throw new ApiError(
      409,
      "Document is still being processed. Try again later",
    );

//   console.log(question, sessionId, documentId);

  const [questionEmbedding] = await generateEmbeddings([
    {
      text: question,
    },
  ]);

//   console.log(questionEmbedding);

  const chunks = await searchChunks(questionEmbedding, documentId);

  console.log(chunks);

  if (chunks.length === 0) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {},
          "I couldn't find relevant information in the uploaded document(s).",
        ),
      );
  }

  const prompt = buildPrompt(question, chunks);
  const stream = await streamAnswer(prompt);

  // header set hore hai yaha
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sources = [];

  for (const chunk of chunks) {
    sources.push({
      chunkIndex: chunk.metadata.chunkIndex,
      score: chunk.score,
    });
  }

  for await (const chunk of stream) {
    if (chunk.text) {
      res.write(
        `data: ${JSON.stringify({
          content: chunk.text,
        })}\n\n`,
      );
    }
  }

  res.write(`data: ${JSON.stringify({ done: true, sources })}\n\n`);
  res.end();
});

export { askQuestion };
