"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Contract } from 'ethers';
import { useWalletContext } from '@/contexts/WalletContext';
import { forumAddress, forumABI } from '@/contracts/DecentralizedForum_V3.3';
import { fetchContent, uploadFile, getImageUrl } from '@/lib/ipfsClient';
import { queryKeys } from '@/lib/queryClient';
import type { Post, RawPost, CreatePostInput } from '@/types/forum';

// =============================================================================
// FETCH FUNCTIONS
// =============================================================================

async function parsePost(raw: RawPost): Promise<Post> {
  const id = raw.id.toString();

  // Fetch content from IPFS
  let content = '';
  try {
    const postContent = await fetchContent(raw.contentCID, { useCache: true });
    content = postContent || '';
  } catch (err) {
    console.error(`Error fetching content for post ${id}:`, err);
  }

  // Build image URL if exists
  let imageUrl: string | undefined;
  if (raw.imageCID && raw.imageCID !== '') {
    imageUrl = getImageUrl(raw.imageCID);
  }

  return {
    id,
    title: raw.title,
    content,
    timestamp: parseInt(raw.timestamp.toString(), 10),
    author: raw.author,
    imageUrl,
    cid: raw.contentCID,
    topic: raw.topic,
    communityId: raw.communityId.toString(),
    likeCount: parseInt(raw.likeCount.toString(), 10),
    commentCount: parseInt(raw.commentCount.toString(), 10),
    isActive: raw.isActive,
  };
}

// =============================================================================
// QUERY HOOKS
// =============================================================================

/**
 * Hook para obtener posts de una comunidad específica
 */
export function useCommunityPosts(communityId: string | null) {
  const { provider } = useWalletContext();

  return useQuery({
    queryKey: queryKeys.posts.byCommunity(communityId || ''),
    queryFn: async (): Promise<Post[]> => {
      if (!provider || !communityId) return [];

      const contract = new Contract(forumAddress, forumABI, provider);
      const rawPosts: RawPost[] = await contract.getCommunityPosts(communityId);

      // Filter active posts and parse
      const activePosts = rawPosts.filter((post) => post.isActive);
      const posts = await Promise.all(activePosts.map(parsePost));

      // Sort by timestamp (newest first)
      return posts.sort((a, b) => b.timestamp - a.timestamp);
    },
    enabled: !!provider && !!communityId,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
}

/**
 * Hook para obtener todos los posts activos
 */
export function useAllPosts() {
  const { provider } = useWalletContext();

  return useQuery({
    queryKey: queryKeys.posts.active(),
    queryFn: async (): Promise<Post[]> => {
      if (!provider) return [];

      const contract = new Contract(forumAddress, forumABI, provider);
      const rawPosts: RawPost[] = await contract.getActivePosts();

      const posts = await Promise.all(rawPosts.map(parsePost));

      return posts.sort((a, b) => b.timestamp - a.timestamp);
    },
    enabled: !!provider,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Hook para obtener un post específico
 */
export function usePost(postId: string | null) {
  const { provider } = useWalletContext();

  return useQuery({
    queryKey: queryKeys.posts.detail(postId || ''),
    queryFn: async (): Promise<Post | null> => {
      if (!provider || !postId) return null;

      const contract = new Contract(forumAddress, forumABI, provider);
      const raw: RawPost = await contract.getPost(postId);

      if (!raw.isActive) return null;

      return parsePost(raw);
    },
    enabled: !!provider && !!postId,
  });
}

/**
 * Hook para verificar los likes del usuario en posts
 */
export function useUserPostLikes(postIds: string[]) {
  const { provider, address, isConnected } = useWalletContext();

  return useQuery({
    queryKey: queryKeys.posts.userLikes(postIds, address || ''),
    queryFn: async (): Promise<Record<string, boolean>> => {
      if (!provider || !address || !postIds.length) return {};

      // ABI for postLikes mapping
      const postManagerABI = [
        {
          inputs: [
            { internalType: 'uint32', name: '', type: 'uint32' },
            { internalType: 'address', name: '', type: 'address' },
          ],
          name: 'postLikes',
          outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
          stateMutability: 'view',
          type: 'function',
        },
      ];

      const mainContract = new Contract(forumAddress, forumABI, provider);
      const postManagerAddress = await mainContract.postManager();
      const postManager = new Contract(postManagerAddress, postManagerABI, provider);

      const likeStatus: Record<string, boolean> = {};

      await Promise.all(
        postIds.map(async (postId) => {
          try {
            const hasLiked = await postManager.postLikes(postId, address);
            likeStatus[postId] = hasLiked;
          } catch (e) {
            likeStatus[postId] = false;
          }
        })
      );

      return likeStatus;
    },
    enabled: isConnected && !!provider && !!address && postIds.length > 0,
    staleTime: 30 * 1000, // 30 segundos
  });
}

// =============================================================================
// MUTATION HOOKS
// =============================================================================

/**
 * Hook para crear un nuevo post
 */
export function useCreatePost() {
  const { provider } = useWalletContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePostInput): Promise<void> => {
      if (!provider) throw new Error('No provider connected');

      const signer = await provider.getSigner();
      const contract = new Contract(forumAddress, forumABI, signer);

      // Check if topic exists, if not add it first
      const topics = await contract.getCommunityTopics(input.communityId);
      const topicExists = topics.includes(input.topic);

      if (!topicExists) {
        const addTopicTx = await contract.addTopicToCommunity(input.communityId, input.topic);
        await addTopicTx.wait();
      }

      // Upload image if provided
      let imageCID = '';
      if (input.image) {
        imageCID = await uploadFile(input.image, 'post-image.jpg');
      }

      // Upload content
      const textBlob = new Blob([input.content], { type: 'text/html' });
      const textFile = new File([textBlob], 'post.html', { type: 'text/html' });
      const contentCID = await uploadFile(textFile, 'post.html');

      // Create post on blockchain
      const tx = await contract.createPost(
        input.communityId,
        input.title || 'No title',
        contentCID,
        imageCID,
        input.topic
      );

      await tx.wait();
    },
    onSuccess: (_, { communityId }) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.byCommunity(communityId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.active() });
      queryClient.invalidateQueries({ queryKey: queryKeys.communities.detail(communityId) });
    },
  });
}

/**
 * Hook para dar like a un post
 */
export function useLikePost() {
  const { provider, address } = useWalletContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string): Promise<void> => {
      if (!provider) throw new Error('No provider connected');

      const signer = await provider.getSigner();
      const contract = new Contract(forumAddress, forumABI, signer);

      const tx = await contract.likePost(postId);
      await tx.wait();
    },
    onMutate: async (postId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.posts.all });

      // Get all cached community posts
      const allCachedQueries = queryClient.getQueriesData<Post[]>({
        queryKey: queryKeys.posts.all,
      });

      // Optimistically update like count in all relevant caches
      allCachedQueries.forEach(([queryKey, posts]) => {
        if (posts) {
          queryClient.setQueryData<Post[]>(
            queryKey,
            posts.map((post) =>
              post.id === postId
                ? { ...post, likeCount: post.likeCount + 1 }
                : post
            )
          );
        }
      });

      // Update user likes cache
      if (address) {
        const currentLikes = queryClient.getQueryData<Record<string, boolean>>(
          queryKeys.posts.userLikes([postId], address)
        );
        if (currentLikes !== undefined) {
          queryClient.setQueryData(
            queryKeys.posts.userLikes([postId], address),
            { ...currentLikes, [postId]: true }
          );
        }
      }

      return { allCachedQueries };
    },
    onError: (err, postId, context) => {
      // Rollback on error
      if (context?.allCachedQueries) {
        context.allCachedQueries.forEach(([queryKey, posts]) => {
          queryClient.setQueryData(queryKey, posts);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
    },
  });
}

/**
 * Hook para desactivar/eliminar un post
 */
export function useDeactivatePost() {
  const { provider } = useWalletContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, communityId }: { postId: string; communityId: string }): Promise<void> => {
      if (!provider) throw new Error('No provider connected');

      const signer = await provider.getSigner();
      const contract = new Contract(forumAddress, forumABI, signer);

      const tx = await contract.deactivatePost(postId);
      await tx.wait();
    },
    onMutate: async ({ postId, communityId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.posts.byCommunity(communityId) });

      const previousPosts = queryClient.getQueryData<Post[]>(
        queryKeys.posts.byCommunity(communityId)
      );

      // Optimistically remove the post
      if (previousPosts) {
        queryClient.setQueryData<Post[]>(
          queryKeys.posts.byCommunity(communityId),
          previousPosts.filter((post) => post.id !== postId)
        );
      }

      return { previousPosts, communityId };
    },
    onError: (err, variables, context) => {
      if (context?.previousPosts && context?.communityId) {
        queryClient.setQueryData(
          queryKeys.posts.byCommunity(context.communityId),
          context.previousPosts
        );
      }
    },
    onSettled: (_, __, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.byCommunity(communityId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.active() });
    },
  });
}
