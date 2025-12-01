"use client";

import axios from 'axios';
import { ethers } from 'ethers';

// IPFS Gateways
const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs/";
const BACKUP_GATEWAY = "https://ipfs.io/ipfs/";

// Cache for profile data
const profileCache = new Map<string, any>();

/**
 * Fetch profile data from IPFS using multiple gateways with fallback
 * Similar to how community data is fetched
 */
export const fetchProfileFromIPFS = async (cid: string, useCache = true): Promise<any | null> => {
  if (!cid) return null;

  // Check cache first
  if (useCache && profileCache.has(cid)) {
    console.log(`Profile data retrieved from cache for CID: ${cid}`);
    return profileCache.get(cid);
  }

  // List of gateways to try
  const gateways = [
    PINATA_GATEWAY,
    BACKUP_GATEWAY,
    "https://cloudflare-ipfs.com/ipfs/",
    "https://dweb.link/ipfs/"
  ];

  // Try each gateway
  for (const gateway of gateways) {
    try {
      const response = await axios.get(`${gateway}${cid}`, {
        timeout: 5000,
        validateStatus: (status) => status === 200
      });

      const { data } = response;
      
      // Cache the data
      profileCache.set(cid, data);
      console.log(`Profile data fetched from ${gateway} for CID: ${cid}`);
      
      return data;
    } catch (error) {
      if (error instanceof Error) {
        console.warn(`Failed to fetch from ${gateway} for CID ${cid}:`, error.message);
      }
      // Continue to next gateway
    }
  }

  // If all gateways fail
  console.error(`Failed to fetch profile data for CID ${cid} from all gateways`);
  return null;
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
 * First checks localStorage, then fetches from IPFS if needed
 */
export const getCompleteProfile = async (address: string): Promise<any | null> => {
  if (!address) return null;

  try {
    // Get profile CID from localStorage
    const profileCID = getProfileCIDByAddress(address);
    
    if (profileCID) {
      // Fetch complete profile data from IPFS
      const profileData = await fetchProfileFromIPFS(profileCID);
      return profileData;
    }

    // Fallback to localStorage data if no CID
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nodespeak_profiles');
      if (stored) {
        const profiles = JSON.parse(stored);
        const profile = profiles[address.toLowerCase()];
        
        if (profile) {
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
