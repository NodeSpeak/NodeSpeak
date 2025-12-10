"use client";

import { BrowserProvider, Contract } from 'ethers';
import { forumAddress, forumABI } from '@/contracts/DecentralizedForum_V3.3';
import { fetchJSON, getImageUrl } from '@/lib/ipfsClient';

/**
 * Fetch profile data from IPFS using centralized ipfsClient
 * @deprecated Use fetchJSON from ipfsClient directly
 */
export const fetchProfileFromIPFS = async (cid: string, useCache = true): Promise<any | null> => {
  if (!cid) return null;
  try {
    return await fetchJSON(cid, { useCache });
  } catch (error) {
    console.error(`Failed to fetch profile data for CID ${cid}:`, error);
    return null;
  }
};

/**
 * Get profile by address from localStorage
 * Returns the profileDataCID if available
 */
export const getProfileCIDByAddress = (address: string): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem('nodespeak_profiles');
    if (!stored) return null;
    
    const profiles = JSON.parse(stored);
    const profile = profiles[address.toLowerCase()];
    
    return profile?.profileDataCID || null;
  } catch (error) {
    console.error('Error getting profile CID:', error);
    return null;
  }
};

/**
 * Get complete profile data for an address
 * First checks localStorage, then fetches from blockchain/IPFS if needed
 */
export const getCompleteProfile = async (address: string): Promise<any | null> => {
  if (!address) return null;
  
  console.log(`[getCompleteProfile] Starting for address: ${address}`);

  try {
    // Get profile CID from localStorage (this is for IPFS JSON data, not the profile picture CID)
    const profileDataCID = getProfileCIDByAddress(address);
    console.log(`[getCompleteProfile] profileDataCID from localStorage: ${profileDataCID}`);
    
    if (profileDataCID) {
      // Fetch complete profile data from IPFS using centralized client
      try {
        const profileData = await fetchJSON(profileDataCID);
        console.log(`[getCompleteProfile] Profile from IPFS:`, profileData);
        if (profileData && profileData.profilePicture) {
          return profileData;
        }
      } catch (e) {
        console.warn(`[getCompleteProfile] Failed to fetch from IPFS:`, e);
      }
    }

    // Fallback to localStorage data if no CID
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nodespeak_profiles');
      if (stored) {
        const profiles = JSON.parse(stored);
        const profile = profiles[address.toLowerCase()];
        console.log(`[getCompleteProfile] localStorage profile:`, profile);
        
        if (profile && profile.profileCID) {
          return {
            nickname: profile.nickname || '',
            profilePicture: profile.profileCID || '',
            coverPhoto: profile.coverCID || '',
            bio: profile.bio || '',
            address: address
          };
        }
      }
    }

    // Fetch from blockchain if not in localStorage
    const ethereum = (window as any).ethereum;
    if (ethereum) {
      try {
        console.log(`[getCompleteProfile] Fetching from blockchain for: ${address}`);
        const provider = new BrowserProvider(ethereum);
        const contract = new Contract(forumAddress, forumABI, provider);
        
        // Check if profile exists
        const hasProfile = await contract.hasProfile(address);
        console.log(`[getCompleteProfile] hasProfile for ${address}: ${hasProfile}`);
        
        if (hasProfile) {
          // Get profile from blockchain
          const onChainProfile = await contract.getProfile(address);
          console.log(`[getCompleteProfile] onChainProfile:`, onChainProfile);
          
          // Return profile with proper image URLs from centralized ipfsClient
          const profileData = {
            nickname: onChainProfile.nickname || '',
            profilePicture: getImageUrl(onChainProfile.profileCID || ''),
            coverPhoto: getImageUrl(onChainProfile.coverCID || ''),
            bio: '', // Bio needs to be fetched from IPFS separately
            address: address
          };
          console.log(`[getCompleteProfile] Returning profile:`, profileData);
          return profileData;
        }
      } catch (blockchainError) {
        console.error('Error fetching profile from blockchain:', blockchainError);
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting complete profile:', error);
    return null;
  }
};

/**
 * Helper to shorten Ethereum addresses
 */
export const shortenAddress = (addr: string, chars = 4): string => {
  if (!addr) return '';
  return `${addr.substring(0, chars + 2)}...${addr.substring(addr.length - chars)}`;
};
