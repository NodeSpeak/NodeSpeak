"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Contract } from 'ethers';
import { useWalletContext } from '@/contexts/WalletContext';
import { forumAddress, forumABI } from '@/contracts/DecentralizedForum_V3.3';
import { fetchText, uploadFile, getImageUrl } from '@/lib/ipfsClient';
import { queryKeys } from '@/lib/queryClient';
import type { Profile, RawProfile, CreateProfileInput, UpdateProfileInput } from '@/types/forum';

// =============================================================================
// FETCH FUNCTIONS
// =============================================================================

async function parseProfile(raw: RawProfile): Promise<Profile> {
  let bio = '';
  if (raw.bioCID) {
    try {
      bio = await fetchText(raw.bioCID, { useCache: true });
    } catch (err) {
      console.error('Error fetching bio from IPFS:', err);
    }
  }

  return {
    address: raw.user,
    nickname: raw.nickname,
    profilePicture: raw.profileCID ? getImageUrl(raw.profileCID) : '',
    coverPhoto: raw.coverCID ? getImageUrl(raw.coverCID) : '',
    bio,
    likesGiven: parseInt(raw.likesGiven.toString(), 10),
    likesReceived: parseInt(raw.likesReceived.toString(), 10),
    postCount: parseInt(raw.postCount.toString(), 10),
    commentCount: parseInt(raw.commentCount.toString(), 10),
    followerCount: parseInt(raw.followerCount.toString(), 10),
    followingCount: parseInt(raw.followingCount.toString(), 10),
    isActive: raw.isActive,
    exists: raw.isActive && !!raw.nickname,
  };
}

// =============================================================================
// QUERY HOOKS
// =============================================================================

/**
 * Hook para obtener el perfil de un usuario
 */
export function useProfile(address: string | null) {
  const { provider } = useWalletContext();

  return useQuery({
    queryKey: queryKeys.profiles.detail(address || ''),
    queryFn: async (): Promise<Profile | null> => {
      if (!provider || !address) return null;

      const contract = new Contract(forumAddress, forumABI, provider);

      // Check if profile exists first
      const hasProfile = await contract.hasProfile(address);
      if (!hasProfile) return null;

      const raw: RawProfile = await contract.getProfile(address);
      return parseProfile(raw);
    },
    enabled: !!provider && !!address,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para verificar si un usuario tiene perfil
 */
export function useHasProfile(address: string | null) {
  const { provider } = useWalletContext();

  return useQuery({
    queryKey: queryKeys.profiles.exists(address || ''),
    queryFn: async (): Promise<boolean> => {
      if (!provider || !address) return false;

      const contract = new Contract(forumAddress, forumABI, provider);
      return await contract.hasProfile(address);
    },
    enabled: !!provider && !!address,
  });
}

/**
 * Hook para obtener los seguidores de un usuario
 */
export function useFollowers(address: string | null) {
  const { provider } = useWalletContext();

  return useQuery({
    queryKey: queryKeys.profiles.followers(address || ''),
    queryFn: async (): Promise<string[]> => {
      if (!provider || !address) return [];

      const contract = new Contract(forumAddress, forumABI, provider);
      return await contract.getFollowers(address);
    },
    enabled: !!provider && !!address,
  });
}

/**
 * Hook para obtener a quién sigue un usuario
 */
export function useFollowing(address: string | null) {
  const { provider } = useWalletContext();

  return useQuery({
    queryKey: queryKeys.profiles.following(address || ''),
    queryFn: async (): Promise<string[]> => {
      if (!provider || !address) return [];

      const contract = new Contract(forumAddress, forumABI, provider);
      return await contract.getFollowing(address);
    },
    enabled: !!provider && !!address,
  });
}

/**
 * Hook para verificar si el usuario actual sigue a otro
 */
export function useIsFollowing(targetAddress: string | null) {
  const { provider, address: currentUserAddress } = useWalletContext();

  return useQuery({
    queryKey: [...queryKeys.profiles.following(currentUserAddress || ''), 'isFollowing', targetAddress],
    queryFn: async (): Promise<boolean> => {
      if (!provider || !currentUserAddress || !targetAddress) return false;

      const contract = new Contract(forumAddress, forumABI, provider);
      return await contract.isFollowing(currentUserAddress, targetAddress);
    },
    enabled: !!provider && !!currentUserAddress && !!targetAddress,
  });
}

/**
 * Hook para obtener múltiples perfiles (útil para listas de miembros)
 */
export function useProfiles(addresses: string[]) {
  const { provider } = useWalletContext();

  return useQuery({
    queryKey: ['profiles', 'batch', ...addresses],
    queryFn: async (): Promise<Map<string, Profile>> => {
      if (!provider || !addresses.length) return new Map();

      const contract = new Contract(forumAddress, forumABI, provider);
      const profilesMap = new Map<string, Profile>();

      await Promise.all(
        addresses.map(async (address) => {
          try {
            const hasProfile = await contract.hasProfile(address);
            if (hasProfile) {
              const raw: RawProfile = await contract.getProfile(address);
              const profile = await parseProfile(raw);
              profilesMap.set(address, profile);
            }
          } catch (err) {
            console.error(`Error fetching profile for ${address}:`, err);
          }
        })
      );

      return profilesMap;
    },
    enabled: !!provider && addresses.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

// =============================================================================
// MUTATION HOOKS
// =============================================================================

/**
 * Hook para crear un perfil de usuario
 */
export function useCreateProfile() {
  const { provider, address } = useWalletContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProfileInput): Promise<void> => {
      if (!provider) throw new Error('No provider connected');

      const signer = await provider.getSigner();
      const contract = new Contract(forumAddress, forumABI, signer);

      // Upload files in parallel
      let profileCID = '';
      let coverCID = '';
      let bioCID = '';

      const uploadPromises: Promise<void>[] = [];

      if (input.profilePicture) {
        uploadPromises.push(
          uploadFile(input.profilePicture, 'profile-picture.jpg')
            .then(cid => { profileCID = cid; })
        );
      }

      if (input.coverPhoto) {
        uploadPromises.push(
          uploadFile(input.coverPhoto, 'cover-photo.jpg')
            .then(cid => { coverCID = cid; })
        );
      }

      if (input.bio) {
        const bioBlob = new Blob([input.bio], { type: 'text/plain' });
        const bioFile = new File([bioBlob], 'bio.txt', { type: 'text/plain' });
        uploadPromises.push(
          uploadFile(bioFile, 'bio.txt')
            .then(cid => { bioCID = cid; })
        );
      }

      await Promise.all(uploadPromises);

      const tx = await contract.createProfile(
        input.nickname,
        profileCID,
        coverCID,
        bioCID
      );

      await tx.wait();
    },
    onSuccess: () => {
      if (address) {
        queryClient.invalidateQueries({ queryKey: queryKeys.profiles.detail(address) });
        queryClient.invalidateQueries({ queryKey: queryKeys.profiles.exists(address) });
      }
    },
  });
}

/**
 * Hook para actualizar un perfil de usuario
 */
export function useUpdateProfile() {
  const { provider, address } = useWalletContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProfileInput): Promise<void> => {
      if (!provider) throw new Error('No provider connected');

      const signer = await provider.getSigner();
      const contract = new Contract(forumAddress, forumABI, signer);

      // Upload files in parallel
      let profileCID = '';
      let coverCID = '';
      let bioCID = '';

      const uploadPromises: Promise<void>[] = [];

      if (input.profilePicture) {
        uploadPromises.push(
          uploadFile(input.profilePicture, 'profile-picture.jpg')
            .then(cid => { profileCID = cid; })
        );
      }

      if (input.coverPhoto) {
        uploadPromises.push(
          uploadFile(input.coverPhoto, 'cover-photo.jpg')
            .then(cid => { coverCID = cid; })
        );
      }

      if (input.bio) {
        const bioBlob = new Blob([input.bio], { type: 'text/plain' });
        const bioFile = new File([bioBlob], 'bio.txt', { type: 'text/plain' });
        uploadPromises.push(
          uploadFile(bioFile, 'bio.txt')
            .then(cid => { bioCID = cid; })
        );
      }

      await Promise.all(uploadPromises);

      const tx = await contract.updateProfile(
        input.nickname,
        profileCID,
        coverCID,
        bioCID
      );

      await tx.wait();
    },
    onSuccess: () => {
      if (address) {
        queryClient.invalidateQueries({ queryKey: queryKeys.profiles.detail(address) });
      }
    },
  });
}

/**
 * Hook para seguir a un usuario
 */
export function useFollowUser() {
  const { provider, address: currentUserAddress } = useWalletContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetAddress: string): Promise<void> => {
      if (!provider) throw new Error('No provider connected');

      const signer = await provider.getSigner();
      const contract = new Contract(forumAddress, forumABI, signer);

      const tx = await contract.followUser(targetAddress);
      await tx.wait();
    },
    onMutate: async (targetAddress) => {
      // Optimistically update following status
      if (currentUserAddress) {
        const previousFollowing = queryClient.getQueryData<string[]>(
          queryKeys.profiles.following(currentUserAddress)
        );

        if (previousFollowing) {
          queryClient.setQueryData<string[]>(
            queryKeys.profiles.following(currentUserAddress),
            [...previousFollowing, targetAddress]
          );
        }
      }

      return { targetAddress };
    },
    onError: (err, targetAddress, context) => {
      if (currentUserAddress) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.profiles.following(currentUserAddress),
        });
      }
    },
    onSettled: (_, __, targetAddress) => {
      if (currentUserAddress) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.profiles.following(currentUserAddress),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.profiles.detail(currentUserAddress),
        });
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.profiles.followers(targetAddress),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.profiles.detail(targetAddress),
      });
    },
  });
}

/**
 * Hook para dejar de seguir a un usuario
 */
export function useUnfollowUser() {
  const { provider, address: currentUserAddress } = useWalletContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetAddress: string): Promise<void> => {
      if (!provider) throw new Error('No provider connected');

      const signer = await provider.getSigner();
      const contract = new Contract(forumAddress, forumABI, signer);

      const tx = await contract.unfollowUser(targetAddress);
      await tx.wait();
    },
    onMutate: async (targetAddress) => {
      if (currentUserAddress) {
        const previousFollowing = queryClient.getQueryData<string[]>(
          queryKeys.profiles.following(currentUserAddress)
        );

        if (previousFollowing) {
          queryClient.setQueryData<string[]>(
            queryKeys.profiles.following(currentUserAddress),
            previousFollowing.filter((addr) => addr.toLowerCase() !== targetAddress.toLowerCase())
          );
        }
      }

      return { targetAddress };
    },
    onSettled: (_, __, targetAddress) => {
      if (currentUserAddress) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.profiles.following(currentUserAddress),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.profiles.detail(currentUserAddress),
        });
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.profiles.followers(targetAddress),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.profiles.detail(targetAddress),
      });
    },
  });
}
