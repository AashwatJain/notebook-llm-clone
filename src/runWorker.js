import { startWorker } from "./worker/ingestion.worker.js";
import { connectDb } from "./config/db.js";

// Initialize worker
const init = async () => {
  await connectDb(); // Ensure DB is connected before worker starts
  console.log("Worker is starting...");
  startWorker();
};

init();