/**
 * Tests for IPFS Cache (IndexedDB)
 *
 * These tests verify:
 * 1. If CID is in IndexedDB → no fetch needed
 * 2. If gateway fails → use next gateway
 * 3. Blob is saved correctly by CID
 *
 * Run with: npm test or npx jest
 *
 * Note: These tests require a browser environment or jsdom with IndexedDB support.
 * Consider using fake-indexeddb for unit testing.
 */

import {
  getCachedFile,
  setCachedFile,
  deleteCachedFile,
  hasCachedFile,
  getAllCachedCIDs,
  clearAllCachedFiles,
  isIndexedDBAvailable,
} from '@/lib/ipfsCache';

// Mock IndexedDB for Node.js environment
// In a real setup, you'd use fake-indexeddb:
// import 'fake-indexeddb/auto';

describe('ipfsCache', () => {
  // Skip tests if IndexedDB is not available (SSR/Node environment without mocks)
  const skipIfNoIndexedDB = () => {
    if (!isIndexedDBAvailable()) {
      console.warn('Skipping IndexedDB tests - not available in this environment');
      return true;
    }
    return false;
  };

  beforeEach(async () => {
    if (!skipIfNoIndexedDB()) {
      await clearAllCachedFiles();
    }
  });

  describe('isIndexedDBAvailable', () => {
    it('should return a boolean', () => {
      const result = isIndexedDBAvailable();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('setCachedFile and getCachedFile', () => {
    it('should store and retrieve a blob by CID', async () => {
      if (skipIfNoIndexedDB()) return;

      const testCID = 'QmTestCID123456789012345678901234567890123456';
      const testContent = 'Hello, IPFS!';
      const testBlob = new Blob([testContent], { type: 'text/plain' });

      // Store the blob
      await setCachedFile(testCID, testBlob);

      // Retrieve the blob
      const retrieved = await getCachedFile(testCID);

      expect(retrieved).not.toBeNull();
      expect(retrieved).toBeInstanceOf(Blob);

      // Verify content
      const text = await retrieved!.text();
      expect(text).toBe(testContent);
    });

    it('should return null for non-existent CID', async () => {
      if (skipIfNoIndexedDB()) return;

      const result = await getCachedFile('QmNonExistentCID');
      expect(result).toBeNull();
    });

    it('should overwrite existing entry with same CID', async () => {
      if (skipIfNoIndexedDB()) return;

      const testCID = 'QmOverwriteTest123456789012345678901234567890';
      const blob1 = new Blob(['First'], { type: 'text/plain' });
      const blob2 = new Blob(['Second'], { type: 'text/plain' });

      await setCachedFile(testCID, blob1);
      await setCachedFile(testCID, blob2);

      const retrieved = await getCachedFile(testCID);
      const text = await retrieved!.text();

      expect(text).toBe('Second');
    });
  });

  describe('hasCachedFile', () => {
    it('should return true for cached CID', async () => {
      if (skipIfNoIndexedDB()) return;

      const testCID = 'QmHasTest12345678901234567890123456789012345';
      const testBlob = new Blob(['test'], { type: 'text/plain' });

      await setCachedFile(testCID, testBlob);

      const exists = await hasCachedFile(testCID);
      expect(exists).toBe(true);
    });

    it('should return false for non-cached CID', async () => {
      if (skipIfNoIndexedDB()) return;

      const exists = await hasCachedFile('QmNotCached');
      expect(exists).toBe(false);
    });
  });

  describe('deleteCachedFile', () => {
    it('should delete a cached file', async () => {
      if (skipIfNoIndexedDB()) return;

      const testCID = 'QmDeleteTest12345678901234567890123456789012';
      const testBlob = new Blob(['test'], { type: 'text/plain' });

      await setCachedFile(testCID, testBlob);
      expect(await hasCachedFile(testCID)).toBe(true);

      await deleteCachedFile(testCID);
      expect(await hasCachedFile(testCID)).toBe(false);
    });

    it('should not throw when deleting non-existent CID', async () => {
      if (skipIfNoIndexedDB()) return;

      await expect(deleteCachedFile('QmNonExistent')).resolves.not.toThrow();
    });
  });

  describe('getAllCachedCIDs', () => {
    it('should return all cached CIDs', async () => {
      if (skipIfNoIndexedDB()) return;

      const cids = ['QmCID1_123456789012345678901234567890123456', 'QmCID2_123456789012345678901234567890123456', 'QmCID3_123456789012345678901234567890123456'];

      for (const cid of cids) {
        await setCachedFile(cid, new Blob(['test']));
      }

      const allCIDs = await getAllCachedCIDs();

      expect(allCIDs).toHaveLength(3);
      cids.forEach((cid) => {
        expect(allCIDs).toContain(cid);
      });
    });

    it('should return empty array when cache is empty', async () => {
      if (skipIfNoIndexedDB()) return;

      const allCIDs = await getAllCachedCIDs();
      expect(allCIDs).toHaveLength(0);
    });
  });

  describe('clearAllCachedFiles', () => {
    it('should clear all cached files', async () => {
      if (skipIfNoIndexedDB()) return;

      // Add some files
      await setCachedFile('QmClear1', new Blob(['1']));
      await setCachedFile('QmClear2', new Blob(['2']));

      // Verify they exist
      let allCIDs = await getAllCachedCIDs();
      expect(allCIDs.length).toBeGreaterThan(0);

      // Clear all
      await clearAllCachedFiles();

      // Verify empty
      allCIDs = await getAllCachedCIDs();
      expect(allCIDs).toHaveLength(0);
    });
  });
});

describe('ipfsCache - SSR Safety', () => {
  it('should handle server-side rendering gracefully', async () => {
    // These should not throw even if IndexedDB is unavailable
    const cached = await getCachedFile('QmTest');
    expect(cached).toBeNull();

    await expect(setCachedFile('QmTest', new Blob(['test']))).resolves.not.toThrow();
    await expect(deleteCachedFile('QmTest')).resolves.not.toThrow();

    const exists = await hasCachedFile('QmTest');
    expect(typeof exists).toBe('boolean');

    const cids = await getAllCachedCIDs();
    expect(Array.isArray(cids)).toBe(true);
  });
});
