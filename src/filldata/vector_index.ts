import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

import { getEmbedding } from "./embedding.js";
import { insertVectorsToAstraDB } from "./astra.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function indexFiles() {
  console.log("Start indexing files...");

  const resourceDir = path.resolve(__dirname, "../../resources");
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
    } catch {
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

indexFiles().catch((err) => console.error("Fatal error:", err));
