import { MongoClient } from 'mongodb';

const MONGO_URL = process.env.MONGO_URL;
if (!MONGO_URL) {
  console.error('Defina MONGO_URL no .env');
  process.exit(1);
}

const client = new MongoClient(MONGO_URL);
let db;

async function ensureIndexes() {
  await db.collection('usuarios').createIndex({ email: 1 }, { unique: true });
  await db.collection('sessoes').createIndex({ token: 1 }, { unique: true });
  await db.collection('sessoes').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await db.collection('receitas').createIndex({ userId: 1 });
}

export async function connectDB() {
  await client.connect();
  db = client.db(); // usa o DB da connection string
  await ensureIndexes();
  console.log('MongoDB conectado.');
  return db;
}

export function getDB() {
  if (!db) throw new Error('DB não inicializado. Chame connectDB() antes.');
  return db;
}
