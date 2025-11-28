import fs from 'fs/promises';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'sentiment-cache.json');

async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (e) {
    // ignore
  }
}

async function readCacheFile(): Promise<Record<string, { ts: number; data: any }>> {
  try {
    await ensureCacheDir();
    const raw = await fs.readFile(CACHE_FILE, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    return {};
  }
}

async function writeCacheFile(obj: Record<string, { ts: number; data: any }>) {
  try {
    await ensureCacheDir();
    await fs.writeFile(CACHE_FILE, JSON.stringify(obj), 'utf8');
  } catch (e) {
    // ignore
  }
}

export async function getCached<T = any>(key: string, ttlMs: number): Promise<T | null> {
  try {
    const cache = await readCacheFile();
    const entry = cache[key];
    if (!entry) {
      console.log(`[CACHE] MISS - Key: ${key}`);
      return null;
    }
    const age = Date.now() - (entry.ts || 0);
    if (age > ttlMs) {
      console.log(`[CACHE] EXPIRED - Key: ${key}, Age: ${Math.round(age / 1000)}s, TTL: ${Math.round(ttlMs / 1000)}s`);
      return null;
    }
    console.log(`[CACHE] HIT - Key: ${key}, Age: ${Math.round(age / 1000)}s`);
    return entry.data as T;
  } catch (e) {
    console.error(`[CACHE] ERROR - Key: ${key}`, e);
    return null;
  }
}

export async function setCached(key: string, data: any): Promise<void> {
  try {
    const cache = await readCacheFile();
    cache[key] = { ts: Date.now(), data };
    await writeCacheFile(cache);
  } catch (e) {
    // ignore
  }
}

export async function clearCache(): Promise<void> {
  try {
    await writeCacheFile({});
  } catch (e) {
    // ignore
  }
}
