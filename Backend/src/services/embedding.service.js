import { ApiError } from "../utils/ApiError.js";
import { ai } from "../config/gemini.js";
import { EMBEDDING_MODEL } from "../utils/constants.js";

export const generateEmbeddings = async (chunks) => {
  try {
    const data = []; // array of array

    // console.log(chunks);

    for (const chunk of chunks) {
      // console.log(chunk.text);

      const res = await ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: chunk.text,
        config: { outputDimensionality: 768 },
      });

      // console.log(res);

      data.push(res.embeddings[0].values);
    }

    return data;
  } catch (error) {
    console.log("Error while doing embedding: ", error);
    throw new ApiError(500, "Error while doing embedding");
  }
};
