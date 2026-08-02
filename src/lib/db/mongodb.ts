import { MongoClient, Db } from "mongodb";

if (!process.env.MONGODB_URI) {
  console.warn(
    "Warning: MONGODB_URI is not defined in environment variables. Database operations will fail unless configured."
  );
}

const uri = process.env.MONGODB_URI || "";
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!uri || uri.includes("<db_password>")) {
  const err = new Error(
    "MongoDB URI is missing or contains placeholder '<db_password>'. Please update .env.local with valid credentials."
  );
  clientPromise = Promise.reject(err);
  clientPromise.catch(() => {}); // Prevent top-level unhandled rejection warning during module import
} else if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function getDatabase(dbName = "querida-labs"): Promise<Db> {
  const connectedClient = await clientPromise;
  return connectedClient.db(dbName);
}

export default clientPromise;
