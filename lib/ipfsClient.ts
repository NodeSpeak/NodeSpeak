/**
 * Centralized IPFS Client Module
 * 
 * This module provides a unified interface for all IPFS operations in the project:
 * - Upload files and JSON to IPFS via Pinata
 * - Fetch text and JSON from IPFS with multi-gateway fallback
 * - Build optimized image URLs
 * - In-memory caching with TTL support
 */

import axios from 'axios';

// =============================================================================
// CONFIGURATION
// =============================================================================

// Pinata API credentials for uploads
const PINATA_API_KEY = "f8f064ba07b90906907d";
const PINATA_SECRET_API_KEY = "4cf373c7ce0a77b1e7c26bcbc0ba2996cde5f3b508522459e7ff46afa507be08";
const PINATA_UPLOAD_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";

// Gateway functions ordered by reliability/speed
// Each function takes a CID and returns the full URL
// Updated with public gateways that work better with CORS
const GATEWAYS: Array<(cid: string) => string> = [
  (cid) => `https://gateway.pinata.cloud/ipfs/${cid}`,
  (cid) => `https://ipfs.io/ipfs/${cid}`,
  (cid) => `https://dweb.link/ipfs/${cid}`,
  (cid) => `https://cf-ipfs.com/ipfs/${cid}`,
  (cid) => `https://hardbin.com/ipfs/${cid}`,
  (cid) => `https://w3s.link/ipfs/${cid}`,
];

// Default timeout for IPFS requests (ms)
const DEFAULT_TIMEOUT = 5000;

// Default cache TTL (ms) - 10 minutes
const DEFAULT_CACHE_TTL = 10 * 60 * 1000;

// =============================================================================
// CACHE IMPLEMENTATION
// =============================================================================

interface CacheEntry {
  value: any;
  timestamp: number;
}

// Global in-memory cache
const ipfsCache = new Map<string, CacheEntry>();

/**
 * Get a value from cache if it exists and hasn't expired
 */
function getCached<T>(key: string, ttl: number = DEFAULT_CACHE_TTL): T | null {
  const entry = ipfsCache.get(key);
  if (!entry) return null;
  
  const now = Date.now();
  if (now - entry.timestamp > ttl) {
    // Entry expired, remove it
    ipfsCache.delete(key);
    return null;
  }
  
  return entry.value as T;
}

/**
 * Set a value in cache with current timestamp
 */
function setCache(key: string, value: any): void {
  ipfsCache.set(key, {
    value,
    timestamp: Date.now(),
  });
}

/**
 * Clear all cached entries (useful for testing or forced refresh)
 */
export function clearCache(): void {
  ipfsCache.clear();
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: ipfsCache.size,
    keys: Array.from(ipfsCache.keys()),
  };
}

// =============================================================================
// UPLOAD FUNCTIONS
// =============================================================================

/**
 * Upload a file (Blob or File) to IPFS via Pinata
 * 
 * @param file - The file or blob to upload
 * @param filename - Optional filename for the upload
 * @returns The CID (Content Identifier) of the uploaded file
 * @throws Error if upload fails
 */
export async function uploadFile(
  file: Blob | File,
  filename?: string
): Promise<string> {
  try {
    const formData = new FormData();
    
    // Determine filename
    const name = filename || (file instanceof File ? file.name : 'file');
    formData.append('file', file, name);

    // Add Pinata metadata
    const pinataMetadata = JSON.stringify({
      name: name,
    });
    formData.append('pinataMetadata', pinataMetadata);

    // Upload to Pinata
    const response = await axios.post(PINATA_UPLOAD_URL, formData, {
      maxBodyLength: Infinity,
      headers: {
        'Content-Type': 'multipart/form-data',
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_API_KEY,
      },
    });

    if (response.status !== 200) {
      throw new Error(`Pinata upload failed with status: ${response.status}`);
    }

    return response.data.IpfsHash;
  } catch (error) {
    console.error('[ipfsClient] Error uploading file:', error);
    throw error;
  }
}

/**
 * Upload JSON data to IPFS via Pinata
 * 
 * @param data - Any JSON-serializable data
 * @param filename - Optional filename (defaults to 'data.json')
 * @returns The CID of the uploaded JSON
 * @throws Error if upload fails
 */
export async function uploadJSON(
  data: any,
  filename: string = 'data.json'
): Promise<string> {
  const jsonString = JSON.stringify(data);
  const blob = new Blob([jsonString], { type: 'application/json' });
  return uploadFile(blob, filename);
}

/**
 * Upload text content to IPFS via Pinata
 * 
 * @param text - The text content to upload
 * @param filename - Optional filename (defaults to 'content.txt')
 * @returns The CID of the uploaded text
 * @throws Error if upload fails
 */
export async function uploadText(
  text: string,
  filename: string = 'content.txt'
): Promise<string> {
  const blob = new Blob([text], { type: 'text/plain' });
  return uploadFile(blob, filename);
}

// =============================================================================
// FETCH FUNCTIONS
// =============================================================================

/**
 * Fetch text content from IPFS with multi-gateway fallback
 * 
 * @param cid - The Content Identifier to fetch
 * @param options - Optional configuration
 * @returns The text content
 * @throws Error if all gateways fail
 */
export async function fetchText(
  cid: string,
  options: {
    timeout?: number;
    useCache?: boolean;
    cacheTTL?: number;
  } = {}
): Promise<string> {
  if (!cid) {
    throw new Error('[ipfsClient] CID is required');
  }

  const { 
    timeout = DEFAULT_TIMEOUT, 
    useCache = true,
    cacheTTL = DEFAULT_CACHE_TTL 
  } = options;

  // Check cache first
  const cacheKey = `text:${cid}`;
  if (useCache) {
    const cached = getCached<string>(cacheKey, cacheTTL);
    if (cached !== null) {
      return cached;
    }
  }

  // Try each gateway in order
  let lastError: Error | null = null;
  
  for (const gateway of GATEWAYS) {
    const url = gateway(cid);
    try {
      const response = await axios.get(url, {
        timeout,
        responseType: 'text',
        validateStatus: (status) => status === 200,
      });

      const text = typeof response.data === 'string' 
        ? response.data 
        : JSON.stringify(response.data);

      // Cache the successful result
      if (useCache) {
        setCache(cacheKey, text);
      }

      return text;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      // Continue to next gateway
    }
  }

  // All gateways failed
  console.error(`[ipfsClient] All gateways failed for CID: ${cid}`);
  throw lastError || new Error(`IPFS fetch failed for all gateways: ${cid}`);
}

/**
 * Fetch JSON content from IPFS with multi-gateway fallback
 * 
 * @param cid - The Content Identifier to fetch
 * @param options - Optional configuration
 * @returns The parsed JSON object
 * @throws Error if all gateways fail or JSON parsing fails
 */
export async function fetchJSON<T = any>(
  cid: string,
  options: {
    timeout?: number;
    useCache?: boolean;
    cacheTTL?: number;
  } = {}
): Promise<T> {
  if (!cid) {
    throw new Error('[ipfsClient] CID is required');
  }

  const { 
    timeout = DEFAULT_TIMEOUT, 
    useCache = true,
    cacheTTL = DEFAULT_CACHE_TTL 
  } = options;

  // Check cache first (separate cache key for JSON)
  const cacheKey = `json:${cid}`;
  if (useCache) {
    const cached = getCached<T>(cacheKey, cacheTTL);
    if (cached !== null) {
      return cached;
    }
  }

  // Fetch as text first
  const text = await fetchText(cid, { timeout, useCache: false });

  // Parse JSON safely
  try {
    const parsed = JSON.parse(text) as T;
    
    // Cache the parsed result
    if (useCache) {
      setCache(cacheKey, parsed);
    }

    return parsed;
  } catch (parseError) {
    console.error(`[ipfsClient] JSON parse error for CID ${cid}:`, parseError);
    throw new Error(`Failed to parse JSON from IPFS: ${cid}`);
  }
}

/**
 * Fetch content from IPFS - auto-detects JSON vs text
 * This is a convenience function for backward compatibility
 * 
 * @param cid - The Content Identifier to fetch
 * @param options - Optional configuration
 * @returns The content (parsed JSON if valid, otherwise raw text)
 */
export async function fetchContent(
  cid: string,
  options: {
    timeout?: number;
    useCache?: boolean;
    cacheTTL?: number;
  } = {}
): Promise<any> {
  if (!cid) return null;

  const { 
    timeout = DEFAULT_TIMEOUT, 
    useCache = true,
    cacheTTL = DEFAULT_CACHE_TTL 
  } = options;

  // Check cache first
  const cacheKey = `content:${cid}`;
  if (useCache) {
    const cached = getCached<any>(cacheKey, cacheTTL);
    if (cached !== null) {
      return cached;
    }
  }

  // Fetch text
  const text = await fetchText(cid, { timeout, useCache: false });

  // Try to parse as JSON, fall back to text
  let result: any;
  try {
    result = JSON.parse(text);
  } catch {
    result = text;
  }

  // Cache the result
  if (useCache) {
    setCache(cacheKey, result);
  }

  return result;
}

// =============================================================================
// URL BUILDERS
// =============================================================================

/**
 * Get the best image URL for a CID
 * Uses the primary gateway (Pinata) for images
 * 
 * @param cid - The Content Identifier of the image
 * @returns The full URL to the image, or empty string if no CID
 */
export function getImageUrl(cid: string): string {
  if (!cid) return '';
  // If already a full URL, return as is
  if (cid.startsWith('http://') || cid.startsWith('https://')) {
    return cid;
  }
  // Use primary gateway for images (Pinata has good CDN)
  return GATEWAYS[0](cid);
}

/**
 * Get image URL with a specific gateway index
 * Useful for fallback image loading in components
 * 
 * @param cid - The Content Identifier of the image
 * @param gatewayIndex - Index of the gateway to use (0-based)
 * @returns The full URL to the image
 */
export function getImageUrlWithGateway(cid: string, gatewayIndex: number): string {
  if (!cid) return '';
  const index = Math.min(gatewayIndex, GATEWAYS.length - 1);
  return GATEWAYS[index](cid);
}

/**
 * Get all possible image URLs for a CID (for fallback loading)
 * 
 * @param cid - The Content Identifier of the image
 * @returns Array of URLs from all gateways
 */
export function getAllImageUrls(cid: string): string[] {
  if (!cid) return [];
  return GATEWAYS.map((gateway) => gateway(cid));
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if a string is a valid IPFS CID (basic validation)
 * 
 * @param cid - The string to validate
 * @returns True if it looks like a valid CID
 */
export function isValidCID(cid: string): boolean {
  if (!cid || typeof cid !== 'string') return false;
  // CIDv0 starts with Qm and is 46 chars, CIDv1 starts with b and varies
  return (cid.startsWith('Qm') && cid.length === 46) || 
         (cid.startsWith('b') && cid.length >= 50);
}

/**
 * Pre-warm the cache by fetching multiple CIDs in parallel
 * Useful for prefetching content that will be needed soon
 * 
 * @param cids - Array of CIDs to prefetch
 * @param type - Type of content ('json' | 'text' | 'content')
 */
export async function prefetchCIDs(
  cids: string[],
  type: 'json' | 'text' | 'content' = 'content'
): Promise<void> {
  const validCids = cids.filter(Boolean);
  
  const fetchFn = type === 'json' ? fetchJSON : 
                  type === 'text' ? fetchText : 
                  fetchContent;

  await Promise.allSettled(
    validCids.map((cid) => fetchFn(cid, { useCache: true }))
  );
}

// =============================================================================
// EXPORTS SUMMARY
// =============================================================================
// 
// Upload functions:
//   - uploadFile(file, filename?) → CID
//   - uploadJSON(data, filename?) → CID
//   - uploadText(text, filename?) → CID
//
// Fetch functions:
//   - fetchText(cid, options?) → string
//   - fetchJSON(cid, options?) → T
//   - fetchContent(cid, options?) → any (auto-detect)
//
// URL builders:
//   - getImageUrl(cid) → string
//   - getImageUrlWithGateway(cid, index) → string
//   - getAllImageUrls(cid) → string[]
//
// Utilities:
//   - clearCache() → void
//   - getCacheStats() → { size, keys }
//   - isValidCID(cid) → boolean
//   - prefetchCIDs(cids, type?) → Promise<void>
//
