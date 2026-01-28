import { MongoClient, Db } from "mongodb";

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;
let cachedDb: Db | null = null;

const connectionUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "foodzo";

if (!connectionUri) {
  throw new Error(
    "Missing MONGODB_URI environment variable. Please add it to your environment."
  );
}

const uri = connectionUri;

async function connectClient() {
  if (!clientPromise) {
    client = new MongoClient(uri);
    clientPromise = client.connect();
  }
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  if (cachedDb) return cachedDb;

  const connectedClient = await connectClient();
  cachedDb = connectedClient.db(dbName);
  return cachedDb;
}
