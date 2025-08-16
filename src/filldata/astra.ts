import { DataAPIClient } from "@datastax/astra-db-ts";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

interface Doc {
  content: string;
  metadata: { [key: string]: any };
}

export async function insertVectorsToAstraDB(embeddings: number[][], docs: Doc[]) {
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
