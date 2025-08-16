// indexFiles.ts

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import crypto from "crypto"; // Import the crypto module for UUIDs
import {
  DataAPIClient,
} from "@datastax/astra-db-ts";


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

// === Embedding Function (Unchanged) ===
async function getEmbedding(text) {
  try {
    const response = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: [{ parts: [{ text }] }],
      config: {
        outputDimensionality: 1536,
      },
    });
    return response.embeddings[0].values;
  } catch (err) {
    console.error("Error generating embedding:", err.response?.data || err.message);
    throw err; // Rethrow to stop execution on failure
  }
}



async function insertVectorsToAstraDB(embeddings, docs) {
  console.log("Starting insertion into AstraDB...");

  const token = process.env.ASTRA_DB_APPLICATION_TOKEN;
  const endpoint = process.env.ASTRA_DB_ENDPOINT;
  const collectionName = process.env.ASTRA_DB_COLLECTION_NAME;

  if (!token || !endpoint || !collectionName) {
    console.error("Missing AstraDB environment variables. Please check your .env file.");
    return;
  }

  try {
    const client = new DataAPIClient(token);
    const database = client.db(endpoint);
    const collection = database.collection(collectionName);

    const documentsToInsert = docs.map((doc, index) => ({
      _id: crypto.randomUUID(),
      content: doc.content,
      metadata: doc.metadata,
      $vector: embeddings[index],
    }));

    const result = await collection.insertMany(documentsToInsert);
    console.log(`Inserted ${result.insertedIds.length} documents into AstraDB.`);
  } catch (error) {
    console.error("Error inserting documents:", error);
  }
}


// === Main Function ===
async function indexFiles() {
  console.log("Start indexing files...");

  const resourceDir = path.resolve(__dirname, "../resources");
  const filenames = fs.readdirSync(resourceDir);

  const docs = [];
  const embeddings = [];

  for (const filename of filenames) {
    const filePath = path.join(resourceDir, filename);
    const content = fs.readFileSync(filePath, "utf-8");

    console.log(`Generating embedding for ${filename}...`);
    try {
      const embedding = await getEmbedding(content);
      docs.push({ content, metadata: { filename } });
      embeddings.push(embedding);
      console.log(`→ Done: ${filename} (embedding length: ${embedding.length})`);
    } catch (err) {
      console.error(`Skipping ${filename} due to embedding failure.`);
    }
  }

  if (docs.length > 0) {
    console.log(`Generated embeddings for ${docs.length} documents.`);
    await insertVectorsToAstraDB(embeddings, docs);
    console.log("All available files indexed into AstraDB vector store!");
  } else {
    console.log("No documents to index.");
  }
}

// === Run ===
indexFiles().catch((err) => console.error("Fatal error:", err));
