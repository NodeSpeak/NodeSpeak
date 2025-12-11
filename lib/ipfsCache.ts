/**
 * IPFS Cache Module - IndexedDB-based persistent cache for IPFS files
 *
 * This module provides SSR-safe IndexedDB operations for caching IPFS file blobs.
 * Uses a simple key-value store where key=CID and value=Blob.
 *
 * Database: nodespeak-ipfs-cache
 * Store: files
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const DB_NAME = 'nodespeak-ipfs-cache';
const STORE_NAME = 'files';
const DB_VERSION = 1;

// =============================================================================
// SSR SAFETY UTILITIES
// =============================================================================

/**
 * Check if we're running in a browser environment with IndexedDB support
 */
export function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

// =============================================================================
// DATABASE CONNECTION
// =============================================================================

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Get or create the IndexedDB database connection
 * Returns null if IndexedDB is not available (SSR)
 */
function getDB(): Promise<IDBDatabase> | null {
  if (!isIndexedDBAvailable()) {
    return null;
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[ipfsCache] Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create the files store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  return dbPromise;
}

// =============================================================================
// CRUD OPERATIONS
// =============================================================================

/**
 * Get a cached file blob by CID
 *
 * @param cid - The Content Identifier (key)
 * @returns The cached Blob or null if not found
 */
export async function getCachedFile(cid: string): Promise<Blob | null> {
  const dbPromiseResult = getDB();
  if (!dbPromiseResult) {
    return null; // SSR or no IndexedDB
  }

  try {
    const db = await dbPromiseResult;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(cid);

      request.onerror = () => {
        console.error(`[ipfsCache] Error getting CID ${cid}:`, request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        const result = request.result;
        if (result instanceof Blob) {
          resolve(result);
        } else {
          resolve(null);
        }
      };
    });
  } catch (error) {
    console.error('[ipfsCache] Error in getCachedFile:', error);
    return null;
  }
}

/**
 * Store a file blob in the cache
 *
 * @param cid - The Content Identifier (key)
 * @param blob - The file blob to cache
 */
export async function setCachedFile(cid: string, blob: Blob): Promise<void> {
  const dbPromiseResult = getDB();
  if (!dbPromiseResult) {
    return; // SSR or no IndexedDB
  }

  try {
    const db = await dbPromiseResult;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(blob, cid);

      request.onerror = () => {
        console.error(`[ipfsCache] Error storing CID ${cid}:`, request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  } catch (error) {
    console.error('[ipfsCache] Error in setCachedFile:', error);
  }
}

/**
 * Delete a cached file by CID
 *
 * @param cid - The Content Identifier to delete
 */
export async function deleteCachedFile(cid: string): Promise<void> {
  const dbPromiseResult = getDB();
  if (!dbPromiseResult) {
    return; // SSR or no IndexedDB
  }

  try {
    const db = await dbPromiseResult;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(cid);

      request.onerror = () => {
        console.error(`[ipfsCache] Error deleting CID ${cid}:`, request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  } catch (error) {
    console.error('[ipfsCache] Error in deleteCachedFile:', error);
  }
}

/**
 * Check if a CID exists in the cache
 *
 * @param cid - The Content Identifier to check
 * @returns True if the CID exists in cache
 */
export async function hasCachedFile(cid: string): Promise<boolean> {
  const dbPromiseResult = getDB();
  if (!dbPromiseResult) {
    return false; // SSR or no IndexedDB
  }

  try {
    const db = await dbPromiseResult;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getKey(cid);

      request.onerror = () => {
        console.error(`[ipfsCache] Error checking CID ${cid}:`, request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result !== undefined);
      };
    });
  } catch (error) {
    console.error('[ipfsCache] Error in hasCachedFile:', error);
    return false;
  }
}

/**
 * Get all cached CIDs
 *
 * @returns Array of all cached CIDs
 */
export async function getAllCachedCIDs(): Promise<string[]> {
  const dbPromiseResult = getDB();
  if (!dbPromiseResult) {
    return []; // SSR or no IndexedDB
  }

  try {
    const db = await dbPromiseResult;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAllKeys();

      request.onerror = () => {
        console.error('[ipfsCache] Error getting all CIDs:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        const keys = request.result as IDBValidKey[];
        resolve(keys.filter((key): key is string => typeof key === 'string'));
      };
    });
  } catch (error) {
    console.error('[ipfsCache] Error in getAllCachedCIDs:', error);
    return [];
  }
}

/**
 * Clear all cached files
 */
export async function clearAllCachedFiles(): Promise<void> {
  const dbPromiseResult = getDB();
  if (!dbPromiseResult) {
    return; // SSR or no IndexedDB
  }

  try {
    const db = await dbPromiseResult;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => {
        console.error('[ipfsCache] Error clearing cache:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  } catch (error) {
    console.error('[ipfsCache] Error in clearAllCachedFiles:', error);
  }
}

/**
 * Get cache statistics
 *
 * @returns Object with cache size info
 */
export async function getCacheStats(): Promise<{
  count: number;
  cids: string[];
}> {
  const cids = await getAllCachedCIDs();
  return {
    count: cids.length,
    cids,
  };
}

// =============================================================================
// EXPORTS SUMMARY
// =============================================================================
//
// SSR Safety:
//   - isIndexedDBAvailable() → boolean
//
// CRUD Operations:
//   - getCachedFile(cid) → Promise<Blob | null>
//   - setCachedFile(cid, blob) → Promise<void>
//   - deleteCachedFile(cid) → Promise<void>
//   - hasCachedFile(cid) → Promise<boolean>
//
// Utilities:
//   - getAllCachedCIDs() → Promise<string[]>
//   - clearAllCachedFiles() → Promise<void>
//   - getCacheStats() → Promise<{ count, cids }>
//
