"use client";

import { useState, useEffect } from 'react';
import { getCompleteProfile, shortenAddress } from '@/lib/profileUtils';

export interface UserProfile {
  address: string;
  nickname: string;
  profilePicture: string;
  coverPhoto: string;
  bio: string;
}

export const useUserProfile = (address: string | undefined) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!address) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        // Fetch complete profile from IPFS or localStorage
        const profileData = await getCompleteProfile(address);
        
        if (profileData) {
          setProfile({
            address,
            nickname: profileData.nickname || shortenAddress(address),
            profilePicture: profileData.profilePicture 
              ? `https://gateway.pinata.cloud/ipfs/${profileData.profilePicture}` 
              : '',
            coverPhoto: profileData.coverPhoto 
              ? `https://gateway.pinata.cloud/ipfs/${profileData.coverPhoto}` 
              : '',
            bio: profileData.bio || ''
          });
        } else {
          // Default profile if none exists
          setProfile({
            address,
            nickname: shortenAddress(address),
            profilePicture: '',
            coverPhoto: '',
            bio: ''
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setProfile({
          address,
          nickname: shortenAddress(address),
          profilePicture: '',
          coverPhoto: '',
          bio: ''
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [address]);

  return { profile, loading };
};
