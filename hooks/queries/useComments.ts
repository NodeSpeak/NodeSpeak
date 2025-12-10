"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Contract } from 'ethers';
import { useWalletContext } from '@/contexts/WalletContext';
import { forumAddress, forumABI } from '@/contracts/DecentralizedForum_V3.3';
import { queryKeys } from '@/lib/queryClient';
import type { Comment, RawComment, CreateCommentInput, Post } from '@/types/forum';

// =============================================================================
// FETCH FUNCTIONS
// =============================================================================

function parseComment(raw: RawComment, postId: string, index: number): Comment {
  return {
    id: raw.id.toString(),
    index: index + 1, // 1-based index for contract calls
    postId,
    author: raw.author,
    content: raw.content,
    timestamp: parseInt(raw.timestamp.toString(), 10),
    isActive: raw.isActive,
  };
}

// =============================================================================
// QUERY HOOKS
// =============================================================================

/**
 * Hook para obtener comentarios de un post específico
 */
export function useComments(postId: string | null) {
  const { provider } = useWalletContext();

  return useQuery({
    queryKey: queryKeys.comments.byPost(postId || ''),
    queryFn: async (): Promise<Comment[]> => {
      if (!provider || !postId) return [];

      const contract = new Contract(forumAddress, forumABI, provider);
      const rawComments: RawComment[] = await contract.getComments(postId);

      // Parse and filter active comments
      const comments = rawComments
        .map((raw, index) => parseComment(raw, postId, index))
        .filter((comment) => comment.isActive);

      // Sort by newest first
      return comments.sort((a, b) => b.timestamp - a.timestamp);
    },
    enabled: !!provider && !!postId,
    staleTime: 30 * 1000, // 30 segundos
  });
}

// =============================================================================
// MUTATION HOOKS
// =============================================================================

/**
 * Hook para agregar un comentario a un post
 */
export function useAddComment() {
  const { provider, address } = useWalletContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCommentInput): Promise<void> => {
      if (!provider) throw new Error('No provider connected');

      const signer = await provider.getSigner();
      const contract = new Contract(forumAddress, forumABI, signer);

      const tx = await contract.addComment(input.postId, input.content);
      await tx.wait();
    },
    onMutate: async (input) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.comments.byPost(input.postId),
      });

      // Snapshot previous comments
      const previousComments = queryClient.getQueryData<Comment[]>(
        queryKeys.comments.byPost(input.postId)
      );

      // Optimistically add the new comment
      if (previousComments && address) {
        const optimisticComment: Comment = {
          id: `temp-${Date.now()}`,
          index: previousComments.length + 1,
          postId: input.postId,
          author: address,
          content: input.content,
          timestamp: Math.floor(Date.now() / 1000),
          isActive: true,
        };

        queryClient.setQueryData<Comment[]>(
          queryKeys.comments.byPost(input.postId),
          [optimisticComment, ...previousComments]
        );
      }

      // Also update comment count in posts
      const allPostQueries = queryClient.getQueriesData<Post[]>({
        queryKey: queryKeys.posts.all,
      });

      allPostQueries.forEach(([queryKey, posts]) => {
        // Asegurarnos de que posts sea realmente un array antes de usar map
        if (Array.isArray(posts)) {
          queryClient.setQueryData<Post[]>(
            queryKey,
            posts.map((post) =>
              post.id === input.postId
                ? { ...post, commentCount: post.commentCount + 1 }
                : post
            )
          );
        }
      });

      return { previousComments, postId: input.postId, allPostQueries };
    },
    onError: (err, input, context) => {
      // Rollback comments
      if (context?.previousComments) {
        queryClient.setQueryData(
          queryKeys.comments.byPost(context.postId),
          context.previousComments
        );
      }
      // Rollback post comment counts
      if (context?.allPostQueries) {
        context.allPostQueries.forEach(([queryKey, posts]) => {
          queryClient.setQueryData(queryKey, posts);
        });
      }
    },
    onSettled: (_, __, input) => {
      // Refetch to get real data
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.byPost(input.postId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.posts.all,
      });
    },
  });
}

/**
 * Hook para desactivar/eliminar un comentario
 */
export function useDeactivateComment() {
  const { provider } = useWalletContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      commentIndex,
    }: {
      postId: string;
      commentIndex: number;
    }): Promise<void> => {
      if (!provider) throw new Error('No provider connected');

      const signer = await provider.getSigner();
      const contract = new Contract(forumAddress, forumABI, signer);

      // Contract uses 1-based index
      const tx = await contract.deactivateComment(postId, commentIndex);
      await tx.wait();
    },
    onMutate: async ({ postId, commentIndex }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.comments.byPost(postId),
      });

      const previousComments = queryClient.getQueryData<Comment[]>(
        queryKeys.comments.byPost(postId)
      );

      // Optimistically remove the comment
      if (previousComments) {
        queryClient.setQueryData<Comment[]>(
          queryKeys.comments.byPost(postId),
          previousComments.filter((comment) => comment.index !== commentIndex)
        );
      }

      // Update post comment count
      const allPostQueries = queryClient.getQueriesData<Post[]>({
        queryKey: queryKeys.posts.all,
      });

      allPostQueries.forEach(([queryKey, posts]) => {
        if (posts) {
          queryClient.setQueryData<Post[]>(
            queryKey,
            posts.map((post) =>
              post.id === postId
                ? { ...post, commentCount: Math.max(0, post.commentCount - 1) }
                : post
            )
          );
        }
      });

      return { previousComments, postId, allPostQueries };
    },
    onError: (err, variables, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(
          queryKeys.comments.byPost(context.postId),
          context.previousComments
        );
      }
      if (context?.allPostQueries) {
        context.allPostQueries.forEach(([queryKey, posts]) => {
          queryClient.setQueryData(queryKey, posts);
        });
      }
    },
    onSettled: (_, __, { postId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.byPost(postId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.posts.all,
      });
    },
  });
}
