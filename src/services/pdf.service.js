import { PDFParse } from "pdf-parse";
import fs from "fs/promises";
import { ApiError } from "../utils/ApiError.js";

export const cleanText = (text) => {
  return text.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
};

export const parsePDF = async (filePath) => {
  try {
    if (!filePath) throw new ApiError(404, "PDF is missing");

    const buffer = await fs.readFile(filePath);
    const parser = new PDFParse({ data: buffer });

    const data = await parser.getText();

    const cleanedText = cleanText(data.text);

    await fs.unlink(filePath);
    await parser.destroy();

    // console.log(cleanedText);
    return { text: cleanedText, totalPages: data.total };
  } catch (error) {
    console.error("Original Error in parsePDF:", error);
    throw new ApiError(500, "Can not parse pdf");
  }
};
