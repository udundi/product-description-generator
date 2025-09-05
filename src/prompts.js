import { brandPhrases } from "./brandPhrases.js";

export function productDescriptionPrompt(title, vendor, category, type, tags) {
  return `
  You are a marketing AI. Write a compelling product description.

  Title: ${title}
  Vendor: ${vendor}
  Category: ${category}
  Type: ${type}
  Tags: ${tags}
  Brand phrases: ${brandPhrases.join(", ")}

  Don't send back a title, just send a description.

  Keep it professional, engaging, and under 150 words.
  `;
}
