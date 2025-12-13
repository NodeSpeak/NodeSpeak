"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Contract, JsonRpcProvider } from 'ethers';
import { useWalletContext } from '@/contexts/WalletContext';
import { forumAddress, forumABI } from '@/contracts/DecentralizedForum_V3.3';
import { fetchContent, uploadFile, uploadJSON, getImageUrl } from '@/lib/ipfsClient';
import { queryKeys } from '@/lib/queryClient';
import type { Community, RawCommunity, CreateCommunityInput, UpdateCommunityImagesInput } from '@/types/forum';

// Public RPC for Arbitrum One - allows reading without wallet connection
const ARBITRUM_RPC = "https://arb1.arbitrum.io/rpc";

// =============================================================================
// FETCH FUNCTIONS
// =============================================================================

async function fetchCommunityData(contentCID: string): Promise<{
  name: string;
  description: string;
  photo: string;
  coverImage: string;
} | null> {
  if (!contentCID) return null;
  try {
    const data = await fetchContent(contentCID, { useCache: true });
    return {
      name: data?.name || '',
      description: data?.description || '',
      photo: data?.photo || '',
      coverImage: data?.coverImage || '',
    };
  } catch (error) {
    console.error('Error fetching community data from IPFS:', error);
    return null;
  }
}

async function parseCommunity(
  raw: RawCommunity,
  contract: Contract,
  userAddress: string | null
): Promise<Community> {
  const id = raw.id.toString();

  // Fetch IPFS data
  const ipfsData = await fetchCommunityData(raw.contentCID);

  // Check membership
  let isMember = false;
  let memberCount = 0;
  const isCreator = userAddress
    ? raw.creator.toLowerCase() === userAddress.toLowerCase()
    : false;

  if (userAddress) {
    try {
      if (isCreator) {
        isMember = true;
      } else {
        isMember = await contract.isMember(id, userAddress);
      }
      const count = await contract.getCommunityMemberCount(id);
      memberCount = parseInt(count.toString(), 10);
    } catch (err) {
      console.error(`Error checking membership for community ${id}:`, err);
    }
  }

  return {
    id,
    name: ipfsData?.name || `Community #${id}`,
    description: ipfsData?.description || 'No description available',
    topicCount: raw.topics.length,
    postCount: parseInt(raw.postCount.toString(), 10),
    creator: raw.creator,
    isMember,
    isCreator,
    memberCount,
    topics: raw.topics,
    photo: ipfsData?.photo || '',
    coverImage: ipfsData?.coverImage || '',
    isActive: raw.isActive,
  };
}

// =============================================================================
// QUERY HOOKS
// =============================================================================

/**
 * Hook para obtener todas las comunidades activas
 */
export function useCommunities() {
  const { provider, address } = useWalletContext();

  return useQuery({
    queryKey: queryKeys.communities.active(),
    queryFn: async (): Promise<Community[]> => {
      if (!provider) {
        throw new Error('No provider available');
      }

      const contract = new Contract(forumAddress, forumABI, provider);
      const rawCommunities: RawCommunity[] = await contract.getActiveCommunities();

      // Parse all communities in parallel
      const communities = await Promise.all(
        rawCommunities.map((raw) => parseCommunity(raw, contract, address))
      );

      return communities;
    },
    enabled: !!provider,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook para obtener comunidades usando RPC público (sin wallet)
 * Ideal para landing pages y vistas públicas
 */
export function usePublicCommunities() {
  return useQuery({
    queryKey: ['communities', 'public'],
    queryFn: async (): Promise<Community[]> => {
      const provider = new JsonRpcProvider(ARBITRUM_RPC);
      const contract = new Contract(forumAddress, forumABI, provider);
      const rawCommunities: RawCommunity[] = await contract.getActiveCommunities();

      // Parse communities without user-specific data
      const communities = await Promise.all(
        rawCommunities.map((raw) => parseCommunity(raw, contract, null))
      );

      return communities;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    retry: 2,
  });
}

/**
 * Hook para obtener una comunidad específica
 */
export function useCommunity(communityId: string | null) {
  const { provider, address } = useWalletContext();

  return useQuery({
    queryKey: queryKeys.communities.detail(communityId || ''),
    queryFn: async (): Promise<Community | null> => {
      if (!provider || !communityId) return null;

      const contract = new Contract(forumAddress, forumABI, provider);
      const raw: RawCommunity = await contract.getCommunity(communityId);

      if (!raw.isActive) return null;

      return parseCommunity(raw, contract, address);
    },
    enabled: !!provider && !!communityId,
  });
}

/**
 * Hook para obtener los tópicos de una comunidad
 */
export function useCommunityTopics(communityId: string | null) {
  const { provider } = useWalletContext();

  return useQuery({
    queryKey: queryKeys.communities.topics(communityId || ''),
    queryFn: async (): Promise<string[]> => {
      if (!provider || !communityId) return [];

      const contract = new Contract(forumAddress, forumABI, provider);
      const topics = await contract.getCommunityTopics(communityId);
      return topics;
    },
    enabled: !!provider && !!communityId,
  });
}

/**
 * Hook para obtener el conteo de miembros de una comunidad
 */
export function useCommunityMemberCount(communityId: string | null) {
  const { provider } = useWalletContext();

  return useQuery({
    queryKey: queryKeys.communities.members(communityId || ''),
    queryFn: async (): Promise<number> => {
      if (!provider || !communityId) return 0;

      const contract = new Contract(forumAddress, forumABI, provider);
      const count = await contract.getCommunityMemberCount(communityId);
      return parseInt(count.toString(), 10);
    },
    enabled: !!provider && !!communityId,
  });
}

/**
 * Hook para verificar si el usuario es miembro de una comunidad
 */
export function useIsMember(communityId: string | null) {
  const { provider, address } = useWalletContext();

  return useQuery({
    queryKey: [...queryKeys.communities.members(communityId || ''), 'isMember', address],
    queryFn: async (): Promise<boolean> => {
      if (!provider || !communityId || !address) return false;

      const contract = new Contract(forumAddress, forumABI, provider);
      return await contract.isMember(communityId, address);
    },
    enabled: !!provider && !!communityId && !!address,
  });
}

// =============================================================================
// MUTATION HOOKS
// =============================================================================

/**
 * Hook para crear una nueva comunidad
 */
export function useCreateCommunity() {
  const { provider } = useWalletContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCommunityInput): Promise<void> => {
      if (!provider) throw new Error('No provider connected');

      const signer = await provider.getSigner();
      const contract = new Contract(forumAddress, forumABI, signer);

      // Upload images in parallel
      let photoCID = '';
      let coverImageCID = '';
      const uploadPromises: Promise<void>[] = [];

      if (input.photo) {
        uploadPromises.push(
          uploadFile(input.photo, 'community-photo.jpg')
            .then(cid => { photoCID = cid; })
        );
      }

      if (input.coverImage) {
        uploadPromises.push(
          uploadFile(input.coverImage, 'community-cover.jpg')
            .then(cid => { coverImageCID = cid; })
        );
      }

      await Promise.all(uploadPromises);

      // Upload community data to IPFS
      const communityData = {
        name: input.name,
        description: input.description,
        photo: photoCID,
        coverImage: coverImageCID,
      };

      const contentCID = await uploadJSON(communityData, 'community-data.json');

      // Create on blockchain
      const tx = await contract.createCommunity(
        contentCID,
        input.topics,
        photoCID,
        coverImageCID
      );

      await tx.wait();
    },
    onSuccess: () => {
      // Invalidar cache de comunidades
      queryClient.invalidateQueries({ queryKey: queryKeys.communities.all });
    },
  });
}

/**
 * Hook para unirse a una comunidad
 */
export function useJoinCommunity() {
  const { provider, address } = useWalletContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (communityId: string): Promise<void> => {
      if (!provider) throw new Error('No provider connected');

      const signer = await provider.getSigner();
      const contract = new Contract(forumAddress, forumABI, signer);

      // Check if already a member
      const userAddress = await signer.getAddress();
      const isMember = await contract.isMember(communityId, userAddress);

      if (isMember) {
        throw new Error('Already a member of this community');
      }

      const tx = await contract.joinCommunity(communityId);
      await tx.wait();
    },
    onMutate: async (communityId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.communities.active() });

      // Snapshot previous value
      const previousCommunities = queryClient.getQueryData<Community[]>(
        queryKeys.communities.active()
      );

      // Optimistically update
      if (previousCommunities) {
        queryClient.setQueryData<Community[]>(
          queryKeys.communities.active(),
          previousCommunities.map(c =>
            c.id === communityId
              ? { ...c, isMember: true, memberCount: (c.memberCount || 0) + 1 }
              : c
          )
        );
      }

      return { previousCommunities };
    },
    onError: (err, communityId, context) => {
      // Rollback on error
      if (context?.previousCommunities) {
        queryClient.setQueryData(
          queryKeys.communities.active(),
          context.previousCommunities
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communities.all });
    },
  });
}

/**
 * Hook para abandonar una comunidad
 */
export function useLeaveCommunity() {
  const { provider } = useWalletContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (communityId: string): Promise<void> => {
      if (!provider) throw new Error('No provider connected');

      const signer = await provider.getSigner();
      const contract = new Contract(forumAddress, forumABI, signer);

      const tx = await contract.leaveCommunity(communityId);
      await tx.wait();
    },
    onMutate: async (communityId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.communities.active() });

      const previousCommunities = queryClient.getQueryData<Community[]>(
        queryKeys.communities.active()
      );

      if (previousCommunities) {
        queryClient.setQueryData<Community[]>(
          queryKeys.communities.active(),
          previousCommunities.map(c =>
            c.id === communityId
              ? { ...c, isMember: false, memberCount: Math.max(0, (c.memberCount || 1) - 1) }
              : c
          )
        );
      }

      return { previousCommunities };
    },
    onError: (err, communityId, context) => {
      if (context?.previousCommunities) {
        queryClient.setQueryData(
          queryKeys.communities.active(),
          context.previousCommunities
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communities.all });
    },
  });
}

/**
 * Hook para agregar un tópico a una comunidad
 */
export function useAddTopic() {
  const { provider } = useWalletContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ communityId, topic }: { communityId: string; topic: string }): Promise<void> => {
      if (!provider) throw new Error('No provider connected');

      const signer = await provider.getSigner();
      const contract = new Contract(forumAddress, forumABI, signer);

      const tx = await contract.addTopicToCommunity(communityId, topic);
      await tx.wait();
    },
    onMutate: async ({ communityId, topic }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.communities.active() });
      await queryClient.cancelQueries({ queryKey: queryKeys.communities.topics(communityId) });

      const previousCommunities = queryClient.getQueryData<Community[]>(
        queryKeys.communities.active()
      );

      if (previousCommunities) {
        queryClient.setQueryData<Community[]>(
          queryKeys.communities.active(),
          previousCommunities.map(c =>
            c.id === communityId
              ? { ...c, topics: [...c.topics, topic], topicCount: c.topicCount + 1 }
              : c
          )
        );
      }

      return { previousCommunities };
    },
    onError: (err, variables, context) => {
      if (context?.previousCommunities) {
        queryClient.setQueryData(
          queryKeys.communities.active(),
          context.previousCommunities
        );
      }
    },
    onSettled: (_, __, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communities.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.communities.topics(communityId) });
    },
  });
}

/**
 * Hook para desactivar una comunidad
 */
export function useDeactivateCommunity() {
  const { provider } = useWalletContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (communityId: string): Promise<string> => {
      if (!provider) throw new Error('No provider connected');

      const signer = await provider.getSigner();
      const contract = new Contract(forumAddress, forumABI, signer);

      const tx = await contract.deactivateCommunity(communityId);
      await tx.wait();

      return tx.hash;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communities.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
    },
  });
}

/**
 * Hook para actualizar imágenes de comunidad
 */
export function useUpdateCommunityImages() {
  const { provider } = useWalletContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateCommunityImagesInput): Promise<void> => {
      if (!provider) throw new Error('No provider connected');

      const signer = await provider.getSigner();
      const contract = new Contract(forumAddress, forumABI, signer);

      // Upload new images
      let photoCID = '';
      let coverCID = '';
      const uploadPromises: Promise<void>[] = [];

      if (input.photo) {
        uploadPromises.push(
          uploadFile(input.photo, 'community-photo.jpg')
            .then(cid => { photoCID = cid; })
        );
      }

      if (input.coverImage) {
        uploadPromises.push(
          uploadFile(input.coverImage, 'community-cover.jpg')
            .then(cid => { coverCID = cid; })
        );
      }

      await Promise.all(uploadPromises);

      const tx = await contract.updateCommunityImages(input.communityId, photoCID, coverCID);
      await tx.wait();
    },
    onSuccess: (_, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communities.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.communities.detail(communityId) });
    },
  });
}
