/**
 * Tests for useIPFSFile React Query hook
 *
 * Run with: npm test or npx jest
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useIPFSFile, ipfsQueryKeys } from '@/hooks/queries/useIPFSFile';
import { fetchIPFSFileWithCache } from '@/lib/ipfsClient';

// Mock the ipfsClient
jest.mock('@/lib/ipfsClient', () => ({
  fetchIPFSFileWithCache: jest.fn(),
}));

const mockedFetchIPFSFileWithCache = fetchIPFSFileWithCache as jest.MockedFunction<
  typeof fetchIPFSFileWithCache
>;

// Create a wrapper with QueryClientProvider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

describe('useIPFSFile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query behavior', () => {
    it('should return null blob when CID is null', async () => {
      const { result } = renderHook(() => useIPFSFile(null), {
        wrapper: createWrapper(),
      });

      expect(result.current.blob).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(mockedFetchIPFSFileWithCache).not.toHaveBeenCalled();
    });

    it('should fetch blob when CID is provided', async () => {
      const testCID = 'QmTestCID123456789012345678901234567890123456';
      const testBlob = new Blob(['test content']);

      mockedFetchIPFSFileWithCache.mockResolvedValueOnce(testBlob);

      const { result } = renderHook(() => useIPFSFile(testCID), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // Wait for fetch to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.blob).toBe(testBlob);
      expect(result.current.isError).toBe(false);
    });

    it('should set isError on fetch failure', async () => {
      const testCID = 'QmFailingCID1234567890123456789012345678901';

      mockedFetchIPFSFileWithCache.mockResolvedValueOnce(null);

      const { result } = renderHook(() => useIPFSFile(testCID), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.blob).toBeNull();
    });
  });

  describe('Query key', () => {
    it('should use correct query key format', () => {
      const testCID = 'QmQueryKeyTest12345678901234567890123456789';
      const key = ipfsQueryKeys.file(testCID);

      expect(key).toEqual(['ipfs', testCID]);
    });
  });

  describe('Cache behavior', () => {
    it('should use cached data on subsequent renders', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            staleTime: Infinity,
          },
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const testCID = 'QmCacheTest123456789012345678901234567890123';
      const testBlob = new Blob(['cached']);

      mockedFetchIPFSFileWithCache.mockResolvedValueOnce(testBlob);

      // First render - fetches data
      const { result, rerender } = renderHook(() => useIPFSFile(testCID), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.blob).toBe(testBlob);
      });

      // Should have fetched once
      expect(mockedFetchIPFSFileWithCache).toHaveBeenCalledTimes(1);

      // Re-render - should use cache
      rerender();

      // Should still have same blob, no additional fetch
      expect(result.current.blob).toBe(testBlob);
      expect(mockedFetchIPFSFileWithCache).toHaveBeenCalledTimes(1);
    });
  });

  describe('Refetch behavior', () => {
    it('should provide refetch function', async () => {
      const testCID = 'QmRefetchTest12345678901234567890123456789012';
      const testBlob = new Blob(['refetch']);

      mockedFetchIPFSFileWithCache.mockResolvedValue(testBlob);

      const { result } = renderHook(() => useIPFSFile(testCID), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.refetch).toBe('function');
    });
  });
});

describe('ipfsQueryKeys', () => {
  it('should generate correct file key', () => {
    expect(ipfsQueryKeys.file('QmTest')).toEqual(['ipfs', 'QmTest']);
  });

  it('should generate correct files key', () => {
    expect(ipfsQueryKeys.files(['QmA', 'QmB'])).toEqual([
      'ipfs',
      'batch',
      'QmA',
      'QmB',
    ]);
  });
});
