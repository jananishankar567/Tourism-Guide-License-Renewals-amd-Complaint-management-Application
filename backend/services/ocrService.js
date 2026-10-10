const { createWorker } = require("tesseract.js");

async function extractTextFromImage(imagePath) {
  let worker;

  try {
    worker = await createWorker("eng");

    const result = await worker.recognize(imagePath);

    return result.data.text;

  } catch (error) {

    console.error("OCR error:", error);

    throw new Error(
      "Unable to extract text from document"
    );

  } finally {

    if (worker) {
      await worker.terminate();
    }

  }
}

module.exports = {
  extractTextFromImage
};