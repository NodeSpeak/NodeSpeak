/**
 * IPFS Prefetch Utilities
 *
 * This module provides utilities for prefetching IPFS files into the cache
 * before they are needed, improving perceived performance.
 *
 * Usage in pages:
 * - Import and call prefetch functions in useEffect
 * - Works with React Query's prefetchQuery
 */

import { QueryClient } from '@tanstack/react-query';
import { fetchIPFSFileWithCache } from './ipfsClient';
import { ipfsQueryKeys } from '@/hooks/queries/useIPFSFile';

// =============================================================================
// CORE PREFETCH FUNCTIONS
// =============================================================================

/**
 * Prefetch a single IPFS file into React Query + IndexedDB cache
 *
 * @param queryClient - The React Query client instance
 * @param cid - The Content Identifier to prefetch
 */
export async function prefetchIPFSFile(
  queryClient: QueryClient,
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
 * Prefetch multiple IPFS files in parallel
 *
 * @param queryClient - The React Query client instance
 * @param cids - Array of CIDs to prefetch
 * @param options - Optional configuration
 */
export async function prefetchIPFSFiles(
  queryClient: QueryClient,
  cids: string[],
  options?: {
    /** Maximum concurrent fetches (default: 5) */
    concurrency?: number;
    /** Callback for progress updates */
    onProgress?: (completed: number, total: number) => void;
  }
): Promise<void> {
  const validCids = cids.filter(Boolean);
  if (validCids.length === 0) return;

  const { concurrency = 5, onProgress } = options ?? {};
  let completed = 0;

  // Process in batches for controlled concurrency
  for (let i = 0; i < validCids.length; i += concurrency) {
    const batch = validCids.slice(i, i + concurrency);

    await Promise.allSettled(
      batch.map(async (cid) => {
        await prefetchIPFSFile(queryClient, cid);
        completed++;
        onProgress?.(completed, validCids.length);
      })
    );
  }
}

// =============================================================================
// POST-SPECIFIC PREFETCH
// =============================================================================

interface PostWithImage {
  imageCID?: string;
  imageUrl?: string;
  cid?: string;
}

/**
 * Extract image CIDs from posts for prefetching
 *
 * @param posts - Array of post objects
 * @returns Array of valid image CIDs
 */
export function extractPostImageCIDs(posts: PostWithImage[]): string[] {
  return posts
    .map((post) => {
      // Try imageCID first, then extract from imageUrl
      if (post.imageCID) return post.imageCID;

      // Extract CID from gateway URL if present
      if (post.imageUrl) {
        const match = post.imageUrl.match(/\/ipfs\/([a-zA-Z0-9]+)/);
        if (match) return match[1];
      }

      return null;
    })
    .filter((cid): cid is string => !!cid);
}

/**
 * Prefetch all images from a list of posts
 *
 * @param queryClient - The React Query client instance
 * @param posts - Array of post objects with image data
 */
export async function prefetchPostImages(
  queryClient: QueryClient,
  posts: PostWithImage[]
): Promise<void> {
  const imageCIDs = extractPostImageCIDs(posts);
  await prefetchIPFSFiles(queryClient, imageCIDs);
}

// =============================================================================
// PROFILE-SPECIFIC PREFETCH
// =============================================================================

interface ProfileWithAvatar {
  avatarCID?: string;
  avatar?: string;
  coverCID?: string;
  cover?: string;
}

/**
 * Extract avatar and cover CIDs from profiles for prefetching
 *
 * @param profiles - Array of profile objects
 * @returns Array of valid image CIDs
 */
export function extractProfileImageCIDs(profiles: ProfileWithAvatar[]): string[] {
  const cids: string[] = [];

  profiles.forEach((profile) => {
    if (profile.avatarCID) cids.push(profile.avatarCID);
    if (profile.avatar && !profile.avatar.startsWith('http')) {
      cids.push(profile.avatar);
    }
    if (profile.coverCID) cids.push(profile.coverCID);
    if (profile.cover && !profile.cover.startsWith('http')) {
      cids.push(profile.cover);
    }
  });

  return cids.filter(Boolean);
}

/**
 * Prefetch all avatar and cover images from a list of profiles
 *
 * @param queryClient - The React Query client instance
 * @param profiles - Array of profile objects with image data
 */
export async function prefetchProfileImages(
  queryClient: QueryClient,
  profiles: ProfileWithAvatar[]
): Promise<void> {
  const imageCIDs = extractProfileImageCIDs(profiles);
  await prefetchIPFSFiles(queryClient, imageCIDs);
}

// =============================================================================
// COMMUNITY-SPECIFIC PREFETCH
// =============================================================================

interface CommunityWithImages {
  imageCID?: string;
  image?: string;
  coverCID?: string;
  cover?: string;
}

/**
 * Extract image CIDs from communities for prefetching
 *
 * @param communities - Array of community objects
 * @returns Array of valid image CIDs
 */
export function extractCommunityImageCIDs(communities: CommunityWithImages[]): string[] {
  const cids: string[] = [];

  communities.forEach((community) => {
    if (community.imageCID) cids.push(community.imageCID);
    if (community.image && !community.image.startsWith('http')) {
      cids.push(community.image);
    }
    if (community.coverCID) cids.push(community.coverCID);
    if (community.cover && !community.cover.startsWith('http')) {
      cids.push(community.cover);
    }
  });

  return cids.filter(Boolean);
}

/**
 * Prefetch all images from a list of communities
 *
 * @param queryClient - The React Query client instance
 * @param communities - Array of community objects with image data
 */
export async function prefetchCommunityImages(
  queryClient: QueryClient,
  communities: CommunityWithImages[]
): Promise<void> {
  const imageCIDs = extractCommunityImageCIDs(communities);
  await prefetchIPFSFiles(queryClient, imageCIDs);
}

// =============================================================================
// COMBINED PREFETCH FOR FEED VIEWS
// =============================================================================

/**
 * Prefetch all images for a feed view (posts + profiles + communities)
 *
 * @param queryClient - The React Query client instance
 * @param data - Object containing posts, profiles, and communities
 */
export async function prefetchFeedImages(
  queryClient: QueryClient,
  data: {
    posts?: PostWithImage[];
    profiles?: ProfileWithAvatar[];
    communities?: CommunityWithImages[];
  }
): Promise<void> {
  const allCIDs: string[] = [];

  if (data.posts) {
    allCIDs.push(...extractPostImageCIDs(data.posts));
  }

  if (data.profiles) {
    allCIDs.push(...extractProfileImageCIDs(data.profiles));
  }

  if (data.communities) {
    allCIDs.push(...extractCommunityImageCIDs(data.communities));
  }

  // Deduplicate CIDs
  const uniqueCIDs = Array.from(new Set(allCIDs));

  await prefetchIPFSFiles(queryClient, uniqueCIDs);
}

// =============================================================================
// EXPORTS SUMMARY
// =============================================================================
//
// Core:
//   - prefetchIPFSFile(queryClient, cid) → Promise<void>
//   - prefetchIPFSFiles(queryClient, cids, options?) → Promise<void>
//
// Entity-specific:
//   - prefetchPostImages(queryClient, posts) → Promise<void>
//   - prefetchProfileImages(queryClient, profiles) → Promise<void>
//   - prefetchCommunityImages(queryClient, communities) → Promise<void>
//
// Extractors:
//   - extractPostImageCIDs(posts) → string[]
//   - extractProfileImageCIDs(profiles) → string[]
//   - extractCommunityImageCIDs(communities) → string[]
//
// Combined:
//   - prefetchFeedImages(queryClient, { posts, profiles, communities }) → Promise<void>
//
