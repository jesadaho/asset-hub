import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;

type MongooseCache = {
  conn: mongoose.Mongoose | null;
  promise: Promise<mongoose.Mongoose> | null;
  dbConnections: Record<string, mongoose.Connection>;
};

const globalWithMongoose = global as typeof globalThis & {
  mongoose?: Partial<MongooseCache>;
};

const cached: MongooseCache = {
  conn: globalWithMongoose.mongoose?.conn ?? null,
  promise: globalWithMongoose.mongoose?.promise ?? null,
  dbConnections: globalWithMongoose.mongoose?.dbConnections ?? {},
};

globalWithMongoose.mongoose = cached;

function getConfiguredDbName(envValue: string | undefined, fallback: string) {
  const dbName = envValue?.trim();
  return dbName && dbName.length > 0 ? dbName : fallback;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (!uri) {
    throw new Error("MONGODB_URI is not defined");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const dbName = getConfiguredDbName(process.env.MONGODB_DB_NAME, "asset-ace");
    cached.promise = mongoose.connect(uri, { bufferCommands: false, dbName });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export async function connectDatabase(dbName: string): Promise<mongoose.Connection> {
  const normalizedDbName = dbName.trim();
  if (!normalizedDbName) {
    throw new Error("Database name is required");
  }

  const client = await connectDB();

  if (!cached.dbConnections[normalizedDbName]) {
    cached.dbConnections[normalizedDbName] = client.connection.useDb(normalizedDbName, {
      useCache: true,
    });
  }

  return cached.dbConnections[normalizedDbName];
}

export async function connectAssetAceDB(): Promise<mongoose.Connection> {
  const dbName = getConfiguredDbName(
    process.env.ASSET_ACE_MONGODB_DB_NAME,
    "asset-ace"
  );
  return connectDatabase(dbName);
}
