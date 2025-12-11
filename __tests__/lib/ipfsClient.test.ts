/**
 * Tests for IPFS Client - fetchIPFSFileWithCache
 *
 * These tests verify:
 * 1. If CID is in IndexedDB → no network fetch
 * 2. If a gateway fails → use next gateway
 * 3. Blob is saved correctly by CID
 *
 * Run with: npm test or npx jest
 */

import { fetchIPFSFileWithCache } from '@/lib/ipfsClient';
import { getCachedFile, setCachedFile, clearAllCachedFiles, isIndexedDBAvailable } from '@/lib/ipfsCache';

// Mock axios for network requests
jest.mock('axios');
import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('fetchIPFSFileWithCache', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    if (isIndexedDBAvailable()) {
      await clearAllCachedFiles();
    }
  });

  describe('Cache hit behavior', () => {
    it('should return cached blob without network request if CID is in IndexedDB', async () => {
      if (!isIndexedDBAvailable()) {
        console.warn('Skipping test - IndexedDB not available');
        return;
      }

      const testCID = 'QmCacheHitTest1234567890123456789012345678901';
      const cachedBlob = new Blob(['cached content'], { type: 'text/plain' });

      // Pre-populate cache
      await setCachedFile(testCID, cachedBlob);

      // Fetch should use cache
      const result = await fetchIPFSFileWithCache(testCID);

      // Verify no network request was made
      expect(mockedAxios.get).not.toHaveBeenCalled();

      // Verify we got the cached blob
      expect(result).not.toBeNull();
      const text = await result!.text();
      expect(text).toBe('cached content');
    });
  });

  describe('Gateway fallback behavior', () => {
    it('should try next gateway if first fails', async () => {
      const testCID = 'QmGatewayFallback12345678901234567890123456';
      const successBlob = new Blob(['success']);

      // First gateway fails, second succeeds
      mockedAxios.get
        .mockRejectedValueOnce(new Error('Gateway 1 timeout'))
        .mockResolvedValueOnce({ data: successBlob, status: 200 });

      const result = await fetchIPFSFileWithCache(testCID);

      // Should have tried 2 gateways
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);

      // Should return the successful result
      expect(result).not.toBeNull();
    });

    it('should try all gateways before failing', async () => {
      const testCID = 'QmAllGatewaysFail12345678901234567890123456';

      // All gateways fail
      mockedAxios.get.mockRejectedValue(new Error('Gateway timeout'));

      const result = await fetchIPFSFileWithCache(testCID);

      // Should have tried all 4 gateways
      expect(mockedAxios.get).toHaveBeenCalledTimes(4);

      // Should return null on complete failure
      expect(result).toBeNull();
    });

    it('should use correct gateway URLs in order', async () => {
      const testCID = 'QmGatewayOrderTest123456789012345678901234';

      mockedAxios.get.mockRejectedValue(new Error('fail'));

      await fetchIPFSFileWithCache(testCID);

      // Verify gateway order
      const calls = mockedAxios.get.mock.calls;
      expect(calls[0][0]).toContain('w3s.link');
      expect(calls[1][0]).toContain('cloudflare-ipfs.com');
      expect(calls[2][0]).toContain('gateway.pinata.cloud');
      expect(calls[3][0]).toContain('ipfs.io');
    });
  });

  describe('Cache storage on success', () => {
    it('should store fetched blob in IndexedDB', async () => {
      if (!isIndexedDBAvailable()) {
        console.warn('Skipping test - IndexedDB not available');
        return;
      }

      const testCID = 'QmCacheStorageTest1234567890123456789012345';
      const fetchedBlob = new Blob(['fetched content'], { type: 'text/plain' });

      mockedAxios.get.mockResolvedValueOnce({ data: fetchedBlob, status: 200 });

      // Fetch (should store in cache)
      await fetchIPFSFileWithCache(testCID);

      // Wait for async cache storage
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify it was cached
      const cached = await getCachedFile(testCID);
      expect(cached).not.toBeNull();

      const text = await cached!.text();
      expect(text).toBe('fetched content');
    });
  });

  describe('Input validation', () => {
    it('should return null for empty CID', async () => {
      const result = await fetchIPFSFileWithCache('');
      expect(result).toBeNull();
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should handle direct URL without caching', async () => {
      const testUrl = 'https://example.com/image.png';
      const fetchedBlob = new Blob(['direct']);

      mockedAxios.get.mockResolvedValueOnce({ data: fetchedBlob, status: 200 });

      const result = await fetchIPFSFileWithCache(testUrl);

      expect(result).not.toBeNull();
      expect(mockedAxios.get).toHaveBeenCalledWith(
        testUrl,
        expect.objectContaining({ responseType: 'blob' })
      );
    });

    it('should normalize CID with ipfs:// prefix', async () => {
      const testCID = 'QmNormalizeTest12345678901234567890123456789';
      const fetchedBlob = new Blob(['normalized']);

      mockedAxios.get.mockResolvedValueOnce({ data: fetchedBlob, status: 200 });

      await fetchIPFSFileWithCache(`ipfs://${testCID}`);

      // Should have called with normalized CID in gateway URL
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(testCID),
        expect.any(Object)
      );
    });
  });

  describe('Timeout behavior', () => {
    it('should use 8 second timeout per gateway', async () => {
      const testCID = 'QmTimeoutTest12345678901234567890123456789012';

      mockedAxios.get.mockRejectedValue(new Error('timeout'));

      await fetchIPFSFileWithCache(testCID);

      // Verify timeout was set to 8000ms
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ timeout: 8000 })
      );
    });
  });
});

describe('fetchIPFSFileWithCache - SSR Safety', () => {
  it('should not throw on server-side', async () => {
    const testCID = 'QmSSRSafetyTest123456789012345678901234567';

    mockedAxios.get.mockResolvedValueOnce({
      data: new Blob(['ssr-safe']),
      status: 200,
    });

    await expect(fetchIPFSFileWithCache(testCID)).resolves.not.toThrow();
  });
});
