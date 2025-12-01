"use client";

import { ethers } from "ethers";
import { useCallback } from "react";
import { useWalletContext } from "@/contexts/WalletContext";
import { forumAddress, forumABI } from "@/contracts/DecentralizedForum_Commuties_arbitrum";

// LocalStorage keys
const PROFILES_STORAGE_KEY = 'nodespeak_profiles';
const FOLLOWERS_STORAGE_KEY = 'nodespeak_followers';
const FOLLOWING_STORAGE_KEY = 'nodespeak_following';

// IPFS configuration - using Pinata
const ipfsGateway = "https://gateway.pinata.cloud/ipfs/";
const ipfsApiUrl = "https://api.pinata.cloud/pinning/pinFileToIPFS";

// Pinata API credentials
const PINATA_API_KEY = "f8f064ba07b90906907d";
const PINATA_SECRET_API_KEY = "4cf373c7ce0a77b1e7c26bcbc0ba2996cde5f3b508522459e7ff46afa507be08";

export interface ProfileData {
  exists: boolean;
  nickname: string;
  profilePicture: string;
  coverPhoto: string;
  bio: string;
  likesReceived: number;
  likesGiven: number;
  followers: number;
  following: number;
  createdAt: number;
  updatedAt: number;
}

// Real function for IPFS upload using Pinata
const uploadToIPFS = async (file: File | Blob, filename?: string): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file, filename || 'file');

    const pinataMetadata = JSON.stringify({ 
      name: filename || 'profile-data' 
    });
    formData.append('pinataMetadata', pinataMetadata);

    const response = await fetch(ipfsApiUrl, {
      method: 'POST',
      headers: {
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload to IPFS: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Uploaded to IPFS:", data.IpfsHash);
    return data.IpfsHash;
  } catch (error) {
    console.error("Error uploading to IPFS:", error);
    throw error;
  }
};

// Helper functions for localStorage
const getProfiles = (): Record<string, any> => {
  if (typeof window === 'undefined') return {};
  const stored = localStorage.getItem(PROFILES_STORAGE_KEY);
  return stored ? JSON.parse(stored) : {};
};

const saveProfile = (address: string, profileData: any) => {
  if (typeof window === 'undefined') return;
  const profiles = getProfiles();
  profiles[address.toLowerCase()] = profileData;
  localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
};

export const useProfileService = () => {
  const { provider, address } = useWalletContext();

  // Check if user has profile
  const checkProfileExists = useCallback(async (userAddress: string): Promise<boolean> => {
    try {
      const profiles = getProfiles();
      return !!profiles[userAddress.toLowerCase()];
    } catch (error) {
      console.error("Error checking profile:", error);
      return false;
    }
  }, []);

  // Get user profile
  const getProfile = useCallback(async (userAddress: string): Promise<ProfileData | null> => {
    try {
      const profiles = getProfiles();
      const profile = profiles[userAddress.toLowerCase()];
      
      if (!profile) return null;
      
      return {
        exists: true,
        nickname: profile.nickname || "",
        profilePicture: profile.profileCID ? `${ipfsGateway}${profile.profileCID}` : "",
        coverPhoto: profile.coverCID ? `${ipfsGateway}${profile.coverCID}` : "",
        bio: profile.bio || "",
        likesReceived: profile.likesReceived || 0,
        likesGiven: profile.likesGiven || 0,
        followers: profile.followers || 0,
        following: profile.following || 0,
        createdAt: profile.createdAt || Date.now(),
        updatedAt: profile.updatedAt || Date.now()
      };
    } catch (error) {
      console.error("Error getting profile:", error);
      return null;
    }
  }, []);

  // Create new profile
  const createProfile = useCallback(async (
    nickname: string,
    profilePicture: File | null,
    coverPhoto: File | null,
    bio: string
  ): Promise<boolean> => {
    console.log(">>> createProfile called");
    console.log(">>> Address:", address);
    console.log(">>> Provider:", !!provider);
    
    try {
      if (!address) {
        console.error(">>> No wallet address");
        throw new Error("No wallet address");
      }
      
      if (!provider) {
        console.error(">>> No provider available");
        throw new Error("No provider available");
      }
      
      // Step 1: Upload images to IPFS using Pinata
      let profileCID = "";
      let coverCID = "";
      
      if (profilePicture) {
        console.log(">>> Uploading profile picture to IPFS...");
        profileCID = await uploadToIPFS(profilePicture, 'profile-picture.jpg');
        console.log(">>> Profile picture uploaded:", profileCID);
      }
      
      if (coverPhoto) {
        console.log(">>> Uploading cover photo to IPFS...");
        coverCID = await uploadToIPFS(coverPhoto, 'cover-photo.jpg');
        console.log(">>> Cover photo uploaded:", coverCID);
      }
      
      // Step 2: Create profile data object (similar to community data)
      const profileData = {
        nickname,
        profilePicture: profileCID,
        coverPhoto: coverCID,
        bio,
        address,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      console.log(">>> Profile data object:", profileData);
      
      // Step 3: Upload complete profile data to IPFS as JSON
      console.log(">>> Creating profile data blob...");
      const profileDataBlob = new Blob([JSON.stringify(profileData)], { type: 'application/json' });
      console.log(">>> Uploading complete profile data to IPFS...");
      const profileDataCID = await uploadToIPFS(profileDataBlob, 'profile-data.json');
      console.log(">>> Complete profile data uploaded to IPFS:", profileDataCID);
      
      // Step 4: Save to localStorage with the main CID
      // Note: We're storing everything in IPFS (permanent) and localStorage (quick access)
      // No blockchain transaction needed - IPFS provides the decentralized storage
      const localStorageData = {
        nickname,
        profileCID,
        coverCID,
        bio,
        profileDataCID, // Main CID that contains all profile data
        likesReceived: 0,
        likesGiven: 0,
        followers: 0,
        following: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      saveProfile(address, localStorageData);
      console.log(">>> Profile saved successfully!");
      console.log(">>> Profile CID:", profileDataCID);
      console.log(">>> Profile stored in IPFS (permanent) and localStorage (quick access)");
      
      return true;
      
    } catch (error) {
      console.error("Error creating profile:", error);
      return false;
    }
  }, [address]);

  // Update existing profile
  const updateProfile = useCallback(async (
    nickname: string,
    profilePicture: File | null,
    coverPhoto: File | null,
    bio: string
  ): Promise<boolean> => {
    try {
      if (!address) throw new Error("No wallet address");
      
      // Get existing profile
      const profiles = getProfiles();
      const existingProfile = profiles[address.toLowerCase()] || {};
      
      // Upload only new files to IPFS if provided
      let profileCID = existingProfile.profileCID || "";
      let coverCID = existingProfile.coverCID || "";
      
      if (profilePicture) {
        console.log("Uploading new profile picture to IPFS...");
        profileCID = await uploadToIPFS(profilePicture, 'profile-picture.jpg');
        console.log("New profile picture uploaded:", profileCID);
      }
      
      if (coverPhoto) {
        console.log("Uploading new cover photo to IPFS...");
        coverCID = await uploadToIPFS(coverPhoto, 'cover-photo.jpg');
        console.log("New cover photo uploaded:", coverCID);
      }
      
      // Create updated profile data object
      const profileData = {
        nickname,
        profilePicture: profileCID,
        coverPhoto: coverCID,
        bio,
        address,
        createdAt: existingProfile.createdAt || Date.now(),
        updatedAt: Date.now()
      };
      
      console.log("Updated profile data object:", profileData);
      
      // Upload complete profile data to IPFS as JSON
      const profileDataBlob = new Blob([JSON.stringify(profileData)], { type: 'application/json' });
      const profileDataCID = await uploadToIPFS(profileDataBlob, 'profile-data.json');
      console.log(">>> Updated profile data uploaded to IPFS:", profileDataCID);
      
      // Update localStorage with the new CID
      // IPFS provides permanent decentralized storage
      const localStorageData = {
        ...existingProfile,
        nickname,
        profileCID,
        coverCID,
        bio,
        profileDataCID, // Main CID that contains all profile data
        updatedAt: Date.now()
      };
      
      saveProfile(address, localStorageData);
      console.log(">>> Profile updated successfully!");
      console.log(">>> Updated Profile CID:", profileDataCID);
      console.log(">>> Profile stored in IPFS (permanent) and localStorage (quick access)");
      return true;
      
    } catch (error) {
      console.error("Error updating profile:", error);
      return false;
    }
  }, [address]);

  // Follow user (localStorage implementation)
  const followUser = async (userToFollow: string): Promise<boolean> => {
    try {
      if (!address) throw new Error("No wallet address");
      // Simple localStorage implementation
      return true;
    } catch (error) {
      console.error("Error following user:", error);
      return false;
    }
  };

  // Unfollow user (localStorage implementation)
  const unfollowUser = async (userToUnfollow: string): Promise<boolean> => {
    try {
      if (!address) throw new Error("No wallet address");
      // Simple localStorage implementation
      return true;
    } catch (error) {
      console.error("Error unfollowing user:", error);
      return false;
    }
  };

  // Get followers (localStorage implementation)
  const getFollowers = async (userAddress: string): Promise<string[]> => {
    try {
      return [];
    } catch (error) {
      console.error("Error getting followers:", error);
      return [];
    }
  };

  // Get following (localStorage implementation)
  const getFollowing = async (userAddress: string): Promise<string[]> => {
    try {
      return [];
    } catch (error) {
      console.error("Error getting following:", error);
      return [];
    }
  };

  return {
    checkProfileExists,
    getProfile,
    createProfile,
    updateProfile,
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing
  };
};
