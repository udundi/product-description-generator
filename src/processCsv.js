import fs from "fs"; // Node.js file system module for reading/writing files
import csv from "csv-parser"; // Library to parse CSV files into objects
import { format } from "@fast-csv/format"; // Library to write CSV files
import { generateDescription } from "./generator.js"; // Function to generate product descriptions using OpenAI
import pLimit from "p-limit"; // Library to limit concurrency

// Model pricing for cost estimation (per 1M tokens)
const MODEL_PRICING = {
  "gpt-4o-mini": { input: 0.150, output: 0.600 }, // $ per 1M tokens
};

/**
 * Loads a CSV file and returns its rows as an array of objects.
 * @param {string} file - Path to the CSV file.
 * @returns {Promise<Array>} - Array of row objects.
 */
async function loadCsv(file) {
  const rows = [];
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(file)) return resolve(rows); // Return empty if file doesn't exist
    fs.createReadStream(file)
      .pipe(csv())
      .on("data", (row) => rows.push(row)) // Collect each row
      .on("end", () => resolve(rows)) // Resolve with all rows
      .on("error", reject); // Reject on error
  });
}

/**
 * Main function to process the CSV:
 * - Loads input and output CSVs
 * - Resumes from previous output if available
 * - Generates product descriptions using OpenAI
 * - Writes results to output CSV
 * - Tracks token usage and cost
 * @param {string} inputFile - Path to input CSV
 * @param {string} outputFile - Path to output CSV
 * @param {string} model - Model name for pricing
 */
async function processCSV(inputFile, outputFile, model = "gpt-4o-mini") {
  const inputRows = await loadCsv(inputFile); // Load input data
  const existingRows = await loadCsv(outputFile); // Load existing output (for resume)

  // Map for quick lookup to skip already-processed rows
  const existingMap = new Map(
    existingRows.map((row) => [row["Handle"], row])
  );

  // Prepare output CSV stream
  const outStream = format({ headers: true });
  outStream.pipe(fs.createWriteStream(outputFile));

  // Write existing rows first (resume support)
  for (const row of existingRows) {
    outStream.write(row);
  }

  // Limit concurrency to avoid API rate limits
  const limit = pLimit(2);

  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;

  // Prepare tasks for each input row
  const tasks = inputRows.map((row, index) =>
    limit(async () => {
      // Skip rows that already have a description
      if (existingMap.has(row["Handle"]) && existingMap.get(row["Handle"])["Product Description"]) {
        console.log(`⏩ Skipping [${index + 1}/${inputRows.length}]: ${row["Title"]}`);
        return;
      }

      console.log(`⚙️ Processing [${index + 1}/${inputRows.length}]: ${row["Title"]}`);

      try {
        // Generate description using OpenAI
        const { description, usage } = await generateDescription(row);

        // Track token usage for cost estimation
        totalPromptTokens += usage.prompt_tokens;
        totalCompletionTokens += usage.completion_tokens;

        // Write result to output CSV
        outStream.write({
          ...row,
          "Product Description": description,
        });
      } catch (err) {
        // On error, log and write error message to output
        console.error(`❌ Error on row ${index + 1}:`, err.message);
        outStream.write({
          ...row,
          "Product Description": "ERROR: " + err.message,
        });
      }
    })
  );

  // Wait for all tasks to finish
  await Promise.all(tasks);

  outStream.end(); // Close output stream

  // Calculate and log estimated cost
  const inputCost = (totalPromptTokens / 1_000_000) * MODEL_PRICING[model].input;
  const outputCost = (totalCompletionTokens / 1_000_000) * MODEL_PRICING[model].output;
  const totalCost = inputCost + outputCost;

  console.log(`\n✅ Done! Saved to ${outputFile}`);
  console.log(`📊 Token usage: ${totalPromptTokens} prompt, ${totalCompletionTokens} completion`);
  console.log(`💰 Estimated cost: $${totalCost.toFixed(4)} (input: $${inputCost.toFixed(4)}, output: $${outputCost.toFixed(4)})`);
}

// Run the process on default files
processCSV("input.csv", "output.csv");
