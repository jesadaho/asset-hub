import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL;

let client: Redis | null = null;

function getClient(): Redis | null {
  if (!REDIS_URL?.trim()) return null;
  if (client) return client;
  try {
    client = new Redis(REDIS_URL.trim());
    return client;
  } catch {
    return null;
  }
}

export async function get(key: string): Promise<string | null> {
  const c = getClient();
  if (!c) return null;
  try {
    return await c.get(key);
  } catch {
    return null;
  }
}

export async function set(key: string, value: string, ttlSeconds: number): Promise<void> {
  const c = getClient();
  if (!c) return;
  try {
    await c.setex(key, ttlSeconds, value);
  } catch {
    // ignore
  }
}

export async function del(key: string): Promise<void> {
  const c = getClient();
  if (!c) return;
  try {
    await c.del(key);
  } catch {
    // ignore
  }
}

export async function delByPrefix(prefix: string): Promise<void> {
  const c = getClient();
  if (!c) return;
  try {
    let cursor = "0";
    do {
      const [nextCursor, keys] = await c.scan(cursor, "MATCH", `${prefix}*`, "COUNT", 100);
      cursor = nextCursor;
      if (keys.length > 0) await c.del(...keys);
    } while (cursor !== "0");
  } catch {
    // ignore
  }
}
