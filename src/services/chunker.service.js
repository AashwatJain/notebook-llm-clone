import { CHUNK_SIZE, CHUNK_OVERLAP } from "../utils/constants.js";

export const chunkText = (text) => {
  const data = [];

  for (
    let start = 0;
    start < text.length;
    start += CHUNK_SIZE - CHUNK_OVERLAP
  ) {
    const end = Math.min(start + CHUNK_SIZE, text.length - 1);
    data.push({
      text: text.slice(start, end + 1),
      chunkIndex: data.length,
      startChar: start,
      endChar: end,
    });
  }

  return data;
};
