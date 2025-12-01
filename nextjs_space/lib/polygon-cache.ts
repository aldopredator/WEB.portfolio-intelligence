import fs from 'fs/promises';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), '.cache');
const POLYGON_CACHE_FILE = path.join(CACHE_DIR, 'polygon-cache.json');
const POLYGON_ROTATION_FILE = path.join(CACHE_DIR, 'polygon-rotation.json');

// 24 hours in milliseconds
const POLYGON_CACHE_TTL = 24 * 60 * 60 * 1000;

// 5 minutes in milliseconds (minimum time between ticker updates)
const MIN_FETCH_INTERVAL = 5 * 60 * 1000;

interface PolygonCacheEntry {
  ts: number;
  data: any;
  lastFetch: number;
}

interface RotationState {
  lastTicker: string | null;
  lastFetchTime: number;
}

async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (e) {
    // ignore
  }
}

async function readPolygonCache(): Promise<Record<string, PolygonCacheEntry>> {
  try {
    await ensureCacheDir();
    const raw = await fs.readFile(POLYGON_CACHE_FILE, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    return {};
  }
}

async function writePolygonCache(obj: Record<string, PolygonCacheEntry>) {
  try {
    await ensureCacheDir();
    await fs.writeFile(POLYGON_CACHE_FILE, JSON.stringify(obj, null, 2), 'utf8');
  } catch (e) {
    console.error('[POLYGON-CACHE] Error writing cache:', e);
  }
}

async function readRotationState(): Promise<RotationState> {
  try {
    await ensureCacheDir();
    const raw = await fs.readFile(POLYGON_ROTATION_FILE, 'utf8');
    return JSON.parse(raw || '{"lastTicker":null,"lastFetchTime":0}');
  } catch (e) {
    return { lastTicker: null, lastFetchTime: 0 };
  }
}

async function writeRotationState(state: RotationState) {
  try {
    await ensureCacheDir();
    await fs.writeFile(POLYGON_ROTATION_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (e) {
    console.error('[POLYGON-CACHE] Error writing rotation state:', e);
  }
}

/**
 * Get cached Polygon data for a ticker
 * Returns null if cache miss or expired (older than 24 hours)
 */
export async function getPolygonCached(ticker: string): Promise<any | null> {
  try {
    const cache = await readPolygonCache();
    const entry = cache[ticker];
    
    if (!entry) {
      console.log(`[POLYGON-CACHE] 🔍 MISS - ${ticker} (no cache entry)`);
      return null;
    }
    
    const age = Date.now() - entry.ts;
    const ageHours = Math.round(age / (60 * 60 * 1000));
    
    if (age > POLYGON_CACHE_TTL) {
      console.log(`[POLYGON-CACHE] ⏰ EXPIRED - ${ticker} (age: ${ageHours}h, TTL: 24h)`);
      return null;
    }
    
    console.log(`[POLYGON-CACHE] ✅ HIT - ${ticker} (age: ${ageHours}h, still fresh)`);
    return entry.data;
  } catch (e) {
    console.error(`[POLYGON-CACHE] ❌ ERROR reading cache for ${ticker}:`, e);
    return null;
  }
}

/**
 * Set cached Polygon data for a ticker
 */
export async function setPolygonCached(ticker: string, data: any): Promise<void> {
  try {
    const cache = await readPolygonCache();
    cache[ticker] = { 
      ts: Date.now(), 
      data,
      lastFetch: Date.now()
    };
    await writePolygonCache(cache);
    console.log(`[POLYGON-CACHE] 💾 SAVED - ${ticker}`);
  } catch (e) {
    console.error(`[POLYGON-CACHE] ❌ ERROR writing cache for ${ticker}:`, e);
  }
}

/**
 * Determine which ticker should be fetched next based on rotation strategy
 * Only one ticker every 5 minutes to respect rate limits
 * Returns null if no ticker should be fetched yet
 */
export async function getNextTickerToFetch(tickers: string[]): Promise<string | null> {
  try {
    const rotation = await readRotationState();
    const now = Date.now();
    const timeSinceLastFetch = now - rotation.lastFetchTime;
    
    // Don't fetch if less than 5 minutes since last fetch
    if (timeSinceLastFetch < MIN_FETCH_INTERVAL) {
      const waitMinutes = Math.ceil((MIN_FETCH_INTERVAL - timeSinceLastFetch) / (60 * 1000));
      console.log(`[POLYGON-CACHE] ⏸️  Rate limit protection: wait ${waitMinutes} more minute(s)`);
      return null;
    }
    
    // Get cache to check which tickers need updates
    const cache = await readPolygonCache();
    
    // Find tickers that need updates (no cache or expired)
    const needsUpdate = tickers.filter(ticker => {
      const entry = cache[ticker];
      if (!entry) return true;
      const age = now - entry.ts;
      return age > POLYGON_CACHE_TTL;
    });
    
    if (needsUpdate.length === 0) {
      console.log(`[POLYGON-CACHE] ✨ All tickers fresh (within 24h TTL)`);
      return null;
    }
    
    // Find the next ticker in rotation order
    let nextTicker: string;
    if (!rotation.lastTicker) {
      // First time - start with first ticker that needs update
      nextTicker = needsUpdate[0];
    } else {
      // Find next ticker after lastTicker
      const lastIndex = tickers.indexOf(rotation.lastTicker);
      // Look for next ticker in circular order that needs update
      for (let i = 1; i <= tickers.length; i++) {
        const candidateIndex = (lastIndex + i) % tickers.length;
        const candidate = tickers[candidateIndex];
        if (needsUpdate.includes(candidate)) {
          nextTicker = candidate;
          break;
        }
      }
      
      // If we didn't find one (shouldn't happen), use first that needs update
      if (!nextTicker!) {
        nextTicker = needsUpdate[0];
      }
    }
    
    // Update rotation state
    await writeRotationState({
      lastTicker: nextTicker,
      lastFetchTime: now
    });
    
    console.log(`[POLYGON-CACHE] 🎯 Next ticker to fetch: ${nextTicker} (${needsUpdate.length} tickers need updates)`);
    return nextTicker;
  } catch (e) {
    console.error('[POLYGON-CACHE] ❌ ERROR determining next ticker:', e);
    return null;
  }
}

/**
 * Clear all Polygon cache
 */
export async function clearPolygonCache(): Promise<void> {
  try {
    await writePolygonCache({});
    await writeRotationState({ lastTicker: null, lastFetchTime: 0 });
    console.log('[POLYGON-CACHE] 🗑️  Cache cleared');
  } catch (e) {
    console.error('[POLYGON-CACHE] ❌ ERROR clearing cache:', e);
  }
}
