"use client";

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchIPFSFileWithCache } from '@/lib/ipfsClient';

// =============================================================================
// QUERY KEY
// =============================================================================

export const ipfsQueryKeys = {
  file: (cid: string) => ['ipfs', cid] as const,
  files: (cids: string[]) => ['ipfs', 'batch', ...cids] as const,
};

// =============================================================================
// HOOK
// =============================================================================

export interface UseIPFSFileResult {
  blob: Blob | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * React Query hook for fetching IPFS files with persistent caching
 *
 * Features:
 * - Fetches files from IPFS with multi-gateway fallback
 * - Caches in IndexedDB for persistence across sessions
 * - SSR-safe (returns null on server)
 * - Infinite cache time (files are immutable by CID)
 *
 * @param cid - The Content Identifier to fetch. Pass null to skip the query.
 * @returns { blob, isLoading, isError, error, refetch }
 *
 * @example
 * ```tsx
 * const { blob, isLoading, isError } = useIPFSFile(imageCID);
 *
 * if (isLoading) return <Spinner />;
 * if (isError || !blob) return <Fallback />;
 *
 * const url = URL.createObjectURL(blob);
 * return <img src={url} alt="IPFS Image" />;
 * ```
 */
export function useIPFSFile(cid: string | null): UseIPFSFileResult {
  const {
    data: blob,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ipfsQueryKeys.file(cid || ''),
    queryFn: async (): Promise<Blob | null> => {
      if (!cid) return null;
      return fetchIPFSFileWithCache(cid);
    },
    enabled: !!cid,
    // Files are immutable by CID - never stale
    staleTime: Infinity,
    // Keep in React Query cache indefinitely
    gcTime: Infinity,
    // Don't refetch on window focus - data is immutable
    refetchOnWindowFocus: false,
    // Don't refetch on mount - data is immutable
    refetchOnMount: false,
    // Don't refetch on reconnect - already cached in IndexedDB
    refetchOnReconnect: false,
    // Don't retry - fallback gateways are handled internally
    retry: false,
  });

  return {
    blob: blob ?? null,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
}

// =============================================================================
// PREFETCH UTILITIES
// =============================================================================

/**
 * Prefetch a single IPFS file into the cache
 *
 * @param queryClient - The React Query client
 * @param cid - The Content Identifier to prefetch
 */
export async function prefetchIPFSFile(
  queryClient: ReturnType<typeof useQueryClient>,
  cid: string
): Promise<void> {
  if (!cid) return;

  await queryClient.prefetchQuery({
    queryKey: ipfsQueryKeys.file(cid),
    queryFn: () => fetchIPFSFileWithCache(cid),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/**
 * Prefetch multiple IPFS files into the cache (parallel)
 *
 * @param queryClient - The React Query client
 * @param cids - Array of Content Identifiers to prefetch
 */
export async function prefetchIPFSFiles(
  queryClient: ReturnType<typeof useQueryClient>,
  cids: string[]
): Promise<void> {
  const validCids = cids.filter(Boolean);
  if (validCids.length === 0) return;

  await Promise.allSettled(
    validCids.map((cid) => prefetchIPFSFile(queryClient, cid))
  );
}

/**
 * Hook to get the prefetch functions with the current query client
 *
 * @returns { prefetchFile, prefetchFiles }
 *
 * @example
 * ```tsx
 * const { prefetchFiles } = useIPFSPrefetch();
 *
 * useEffect(() => {
 *   const imageCIDs = posts.map(p => p.imageCID).filter(Boolean);
 *   prefetchFiles(imageCIDs);
 * }, [posts]);
 * ```
 */
export function useIPFSPrefetch() {
  const queryClient = useQueryClient();

  return {
    prefetchFile: (cid: string) => prefetchIPFSFile(queryClient, cid),
    prefetchFiles: (cids: string[]) => prefetchIPFSFiles(queryClient, cids),
  };
}
