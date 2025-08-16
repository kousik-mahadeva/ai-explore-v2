import dotenv from "dotenv";
import { DataAPIClient } from "@datastax/astra-db-ts";
import { getEmbedding } from "./filldata/embedding.js";

dotenv.config();

async function queryVectorForContext() {
  console.log("Started Querying for Context...");

  const query = "Transfer completed but payment has not arrived";
  //const query = "Man proposes god Disposes";

  let embedding: number[];

  try {
    embedding = await getEmbedding(query);
    console.log(`→ Done (embedding length: ${embedding.length})`);
  } catch (err) {
    console.error(`Skipping query due to embedding failure.`);
    return;
  }

  const token = process.env.ASTRA_DB_APPLICATION_TOKEN;
  const endpoint = process.env.ASTRA_DB_ENDPOINT;
  const collectionName = process.env.ASTRA_DB_COLLECTION_NAME;

  if (!token || !endpoint || !collectionName) {
    console.error("Missing Astra DB environment variables.");
    return;
  }

  const client = new DataAPIClient(token);
  const database = client.db(endpoint);
  const collection = database.collection(collectionName);

  try {
    const cursor = collection.find(
      {},
      {
        sort: { $vector: embedding },
        limit: 1, 
      }
    );

    const results = await cursor.toArray();

    console.log("Query results:");
    for (const doc of results) {
      console.log(JSON.stringify(doc, null, 2));
    }
  } catch (err) {
    console.error("Error querying AstraDB with vector:", err);
  }
}

queryVectorForContext().catch((err) =>
  console.error("Fatal error in querying VectorDB:", err)
);
