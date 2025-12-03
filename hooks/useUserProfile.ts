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
          // Helper to build IPFS URL - only add gateway if it's just a CID
          const buildIpfsUrl = (cid: string) => {
            if (!cid) return '';
            // If already a full URL, return as is
            if (cid.startsWith('http://') || cid.startsWith('https://')) {
              return cid;
            }
            // Otherwise, add the gateway prefix
            return `https://gateway.pinata.cloud/ipfs/${cid}`;
          };
          
          const profilePictureUrl = buildIpfsUrl(profileData.profilePicture);
          console.log(`[useUserProfile] Address: ${address}, profileCID: ${profileData.profilePicture}, URL: ${profilePictureUrl}`);
          
          setProfile({
            address,
            nickname: profileData.nickname || shortenAddress(address),
            profilePicture: profilePictureUrl,
            coverPhoto: buildIpfsUrl(profileData.coverPhoto),
            bio: profileData.bio || ''
          });
        } else {
          console.log(`[useUserProfile] No profile data found for: ${address}`);
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
