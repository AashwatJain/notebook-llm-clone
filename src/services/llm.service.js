import { ai } from "../config/gemini.js";
import { CHAT_MODEL } from "../utils/constants.js";

const SYSTEM_INSTRUCTION = `You are a helpful study assistant. Your job is to answer questions based ONLY on the provided context from the user's uploaded documents.
Rules:
1. Answer ONLY from the provided context. Do NOT use your own knowledge.
2. If the context does not contain enough information to answer, say: "I couldn't find this information in the uploaded document(s)."
3. Always cite your sources using the format [Chunk X] after relevant statements.
4. Be concise but thorough. Use bullet points for lists.`;

export const buildPrompt = (question, chunks, history = []) => {
  let contextString = "";

  for (let i = 0; i < chunks.length; ++i) {
    contextString += `Chunk: ${i + 1} : ${chunks[i].text}\n\n`;
  }

  const userMessage = `Context from documents:\n${contextString}\n\nQuestion:\n${question}`;

  return {
    systemInstruction: SYSTEM_INSTRUCTION,
    userMessage,
    history,
  };
};

export const streamAnswer = async (promptData) => {
  const stream = await ai.models.generateContentStream({
    model: CHAT_MODEL,
    contents: [...promptData.history, promptData.userMessage],
    config: {
      systemInstruction: promptData.systemInstruction,
      temperature: 0.3,
    },
  });
  return stream;
};
