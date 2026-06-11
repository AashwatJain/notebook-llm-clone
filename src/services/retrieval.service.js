import { Chunk } from "../models/chunks.model.js";
import mongoose from "mongoose";

export const searchChunks = async (queryEmbedding, documentId, topK = 5) => {
  
  console.log(documentId, topK);

  const pip = [
    {
      $vectorSearch: {
        index: "vector_index",
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: topK * 10,
        limit: topK,
        filter: {
          documentId: new mongoose.Types.ObjectId(documentId),
        },
      },
    },
    {
      $project: {
        _id: 0,
        text: 1,
        metadata: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
    {
      $match: {
        score: { $gte: 0.7 }, // SIMILARITY_THRESHOLD
      },
    },
  ];

  return await Chunk.aggregate(pip);
};
