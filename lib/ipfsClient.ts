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

// Gateway health tracking for intelligent failover
interface GatewayHealth {
  failures: number;
  lastFailure: number;
  lastSuccess: number;
}

const gatewayHealth = new Map<number, GatewayHealth>();

/**
 * Normalize CID/URL to extract clean CID
 * Handles: ipfs://, /ipfs/, https://gateway.../ipfs/, raw CIDs
 */
function normalizeCID(input: string): string {
  if (!input || typeof input !== 'string') return '';

  // Already a full HTTP/HTTPS URL - extract CID from it
  if (input.startsWith('http://') || input.startsWith('https://')) {
    // Extract CID from gateway URL: https://gateway.../ipfs/Qm...
    const match = input.match(/\/ipfs\/([a-zA-Z0-9]+)/);
    if (match && match[1]) {
      return match[1];
    }
    // If no /ipfs/ found, might be a direct URL - return as is for now
    return input;
  }

  // Remove ipfs:// protocol
  let normalized = input.replace(/^ipfs:\/\//, '');

  // Remove leading /ipfs/ or ipfs/ path segments
  normalized = normalized.replace(/^\/?ipfs\//, '');

  // Handle paths like "Qm.../filename" - take only the CID part
  if (normalized.includes('/')) {
    const parts = normalized.split('/');
    normalized = parts[0];
  }

  // Trim whitespace
  normalized = normalized.trim();

  return normalized;
}

/**
 * Check if a string is already a full URL
 */
function isFullURL(input: string): boolean {
  return input.startsWith('http://') || input.startsWith('https://');
}

/**
 * Record gateway success
 */
function recordGatewaySuccess(gatewayIndex: number): void {
  const health = gatewayHealth.get(gatewayIndex) || { failures: 0, lastFailure: 0, lastSuccess: 0 };
  health.lastSuccess = Date.now();
  health.failures = Math.max(0, health.failures - 1); // Reduce failure count on success
  gatewayHealth.set(gatewayIndex, health);
}

/**
 * Record gateway failure
 */
function recordGatewayFailure(gatewayIndex: number): void {
  const health = gatewayHealth.get(gatewayIndex) || { failures: 0, lastFailure: 0, lastSuccess: 0 };
  health.failures++;
  health.lastFailure = Date.now();
  gatewayHealth.set(gatewayIndex, health);
}

/**
 * Get gateways sorted by health (fewer failures first)
 */
function getHealthSortedGateways(): number[] {
  const indices = Array.from({ length: GATEWAYS.length }, (_, i) => i);
  
  return indices.sort((a, b) => {
    const healthA = gatewayHealth.get(a) || { failures: 0, lastFailure: 0, lastSuccess: 0 };
    const healthB = gatewayHealth.get(b) || { failures: 0, lastFailure: 0, lastSuccess: 0 };
    
    // Prioritize gateways with fewer failures
    if (healthA.failures !== healthB.failures) {
      return healthA.failures - healthB.failures;
    }
    
    // If same failures, prefer more recent success
    return healthB.lastSuccess - healthA.lastSuccess;
  });
}

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

  // Normalize the CID
  const normalizedCID = normalizeCID(cid);
  if (!normalizedCID) {
    throw new Error('[ipfsClient] Invalid CID after normalization');
  }

  // If it's still a full URL after normalization, use it directly
  if (isFullURL(normalizedCID)) {
    try {
      const response = await axios.get(normalizedCID, {
        timeout: options.timeout || DEFAULT_TIMEOUT,
        responseType: 'text',
        validateStatus: (status) => status === 200,
      });
      return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    } catch (error) {
      console.error(`[ipfsClient] Direct URL fetch failed: ${normalizedCID}`);
      throw error;
    }
  }

  const { 
    timeout = DEFAULT_TIMEOUT, 
    useCache = true,
    cacheTTL = DEFAULT_CACHE_TTL 
  } = options;

  // Check cache first (use normalized CID for cache key)
  const cacheKey = `text:${normalizedCID}`;
  if (useCache) {
    const cached = getCached<string>(cacheKey, cacheTTL);
    if (cached !== null) {
      return cached;
    }
  }

  // Try each gateway in health-sorted order
  let lastError: Error | null = null;
  const sortedIndices = getHealthSortedGateways();
  
  for (const gatewayIndex of sortedIndices) {
    const gateway = GATEWAYS[gatewayIndex];
    const url = gateway(normalizedCID);
    
    try {
      const response = await axios.get(url, {
        timeout,
        responseType: 'text',
        validateStatus: (status) => status === 200,
      });

      const text = typeof response.data === 'string' 
        ? response.data 
        : JSON.stringify(response.data);

      // Record success and cache result
      recordGatewaySuccess(gatewayIndex);
      if (useCache) {
        setCache(cacheKey, text);
      }

      return text;
    } catch (error) {
      recordGatewayFailure(gatewayIndex);
      lastError = error instanceof Error ? error : new Error(String(error));
      // Continue to next gateway
    }
  }

  // All gateways failed
  console.error(`[ipfsClient] All gateways failed for CID: ${normalizedCID}`);
  throw lastError || new Error(`IPFS fetch failed for all gateways: ${normalizedCID}`);
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
 * Uses the healthiest gateway for images
 * 
 * @param cid - The Content Identifier of the image
 * @returns The full URL to the image, or empty string if no CID
 */
export function getImageUrl(cid: string): string {
  if (!cid) return '';
  
  // Normalize the CID
  const normalizedCID = normalizeCID(cid);
  if (!normalizedCID) return '';
  
  // If it's already a full URL after normalization, return it
  if (isFullURL(normalizedCID)) {
    return normalizedCID;
  }
  
  // Use the healthiest gateway for images
  const sortedIndices = getHealthSortedGateways();
  const bestGatewayIndex = sortedIndices[0] || 0;
  return GATEWAYS[bestGatewayIndex](normalizedCID);
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
  
  // Normalize the CID
  const normalizedCID = normalizeCID(cid);
  if (!normalizedCID) return '';
  
  // If it's already a full URL, return it
  if (isFullURL(normalizedCID)) {
    return normalizedCID;
  }
  
  const index = Math.min(gatewayIndex, GATEWAYS.length - 1);
  return GATEWAYS[index](normalizedCID);
}

/**
 * Get all possible image URLs for a CID (for fallback loading)
 * Returns URLs sorted by gateway health
 * 
 * @param cid - The Content Identifier of the image
 * @returns Array of URLs from all gateways, sorted by health
 */
export function getAllImageUrls(cid: string): string[] {
  if (!cid) return [];
  
  // Normalize the CID
  const normalizedCID = normalizeCID(cid);
  if (!normalizedCID) return [];
  
  // If it's already a full URL, return it as single-item array
  if (isFullURL(normalizedCID)) {
    return [normalizedCID];
  }
  
  // Return URLs sorted by gateway health
  const sortedIndices = getHealthSortedGateways();
  return sortedIndices.map(index => GATEWAYS[index](normalizedCID));
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
