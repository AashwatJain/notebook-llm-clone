import { redis } from "../config/redis.js";
import { chunkText } from "../services/chunker.service.js";
import { generateEmbeddings } from "../services/embedding.service.js";
import { parsePDF } from "../services/pdf.service.js";
import { Document } from "../models/document.model.js";
import { Chunk } from "../models/chunks.model.js";

export const startWorker = async () => {
  while (true) {
    const data = await redis.brpop("ingestion:queue", 0);

    if (!data) continue;

    let documentId;
    try {
      // console.log(data);

      const parsedData = JSON.parse(data[1]);
      documentId = parsedData.documentId;
      const { filePath, jobId } = parsedData;

      await redis.hset(`job:${jobId}`, "status", "parsing");

      const { text, totalPages } = await parsePDF(filePath);

      await redis.hset(`job:${jobId}`, "status", "chunking");

      const chunks = chunkText(text);

      await redis.hset(`job:${jobId}`, "status", "embedding");

      const embeddings = await generateEmbeddings(chunks);

      for (let i = 0; i < chunks.length; ++i) {
        const chunk = await Chunk.create({
          documentId,
          text: chunks[i].text,
          embedding: embeddings[i],
          metadata: {
            chunkIndex: i,
            startChar: chunks[i].startChar,
            endChar: chunks[i].endChar,
          },
        });
      }

      await redis.hset(`job:${jobId}`, "status", "completed");

      const document = await Document.findByIdAndUpdate(documentId, {
        status: "ready",
        pageCount: totalPages,
        chunkCount: chunks.length,
        processedAt: new Date(),
      });
    } catch (error) {
      console.log("Error with worker:", error);

      if (documentId) {
        const document = await Document.findByIdAndUpdate(documentId, {
          status: "failed",
          errorMessage: error.message || "Worker processing failed",
        });
      }
    }
  }
};
