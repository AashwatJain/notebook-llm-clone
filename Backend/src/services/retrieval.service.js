import { Chunk } from "../models/chunks.model.js";
import mongoose from "mongoose";
import { SIMILARITY_THRESHOLD } from "../utils/constants.js";

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
        score: { $gte: SIMILARITY_THRESHOLD }, // SIMILARITY_THRESHOLD
      },
    },
  ];

  return await Chunk.aggregate(pip);
};
