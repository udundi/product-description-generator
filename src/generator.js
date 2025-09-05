// Import required modules and dependencies
import OpenAI from "openai"; // OpenAI API client
import dotenv from "dotenv"; // Loads environment variables from .env file
import fs from "fs"; // File system module for reading local images
import pRetry from "p-retry"; // Retry logic for API calls
import { productDescriptionPrompt } from "./prompts.js"; // Function to generate the prompt

// Load environment variables from .env file
dotenv.config();

// Initialize OpenAI client with API key from environment variables
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Calls the OpenAI API with the provided messages.
 * @param {Array} messages - The messages to send to the API.
 * @returns {Object} - The generated description and token usage.
 */
async function callOpenAI(messages) {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini", // Use the GPT-4o-mini model
    messages,
    max_tokens: 250, // Limit the response length
  });

  return {
    description: response.choices[0].message.content.trim(), // Extract and trim the description
    usage: response.usage, // Token usage info
  };
}

/**
 * Generates a product description using OpenAI, optionally including an image.
 * @param {Object} row - The product data row.
 * @returns {Object} - The generated description and usage info.
 */
export async function generateDescription(row) {
  // Create the prompt using product details
  const prompt = productDescriptionPrompt(
    row["Title"],
    row["Vendor"],
    row["Product Category"],
    row["Type"],
    row["Tags"]
  );

  // Build the initial message for OpenAI
  const messages = [
    {
      role: "user",
      content: [{ type: "text", text: prompt }], // Add the text prompt
    },
  ];

  // Handle image input (remote URL or local file)
  const imageUrl = row["Image Src"];
  if (imageUrl && imageUrl.startsWith("http")) {
    // If image is a remote URL, add it directly
    messages[0].content.push({ type: "image_url", image_url: { url: imageUrl } });
  } else if (imageUrl && fs.existsSync(imageUrl)) {
    // If image is a local file, read and encode as base64
    try {
      const imgBase64 = fs.readFileSync(imageUrl).toString("base64");
      messages[0].content.push({
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${imgBase64}` },
      });
    } catch {
      // If reading fails, log a warning and continue without image
      console.warn(`⚠️ Could not read image at ${imageUrl}, falling back to text only.`);
    }
  }

  // Call OpenAI with retry logic for robustness
  return await pRetry(() => callOpenAI(messages), {
    retries: 5, // Number of retry attempts
    factor: 2, // Exponential backoff factor
    minTimeout: 1000, // Minimum wait time between retries (ms)
    maxTimeout: 10000, // Maximum wait time between retries (ms)
    onFailedAttempt: (error) => {
      // Log a warning on each failed attempt
      console.warn(`⚠️ Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`);
    },
  });
}