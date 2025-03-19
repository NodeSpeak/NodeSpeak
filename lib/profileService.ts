"use client";

import { ethers } from "ethers";
import { useWalletContext } from "@/contexts/WalletContext";

// Contract ABIs - in a real implementation, these would be imported from actual ABI files
const forumABI = [
  "function createProfile(string nickname, string profileCID, string coverCID, string bioCID)",
  "function updateProfile(string nickname, string profileCID, string coverCID, string bioCID)",
  "function getProfile(address user) view returns (tuple(bool exists, string nickname, string profileCID, string coverCID, string bioCID, uint32 likesReceived, uint32 likesGiven, uint32 followers, uint32 following, uint256 createdAt, uint256 updatedAt))",
  "function hasProfile(address user) view returns (bool)",
  "function followUser(address userToFollow)",
  "function unfollowUser(address userToUnfollow)",
  "function getFollowers(address user) view returns (address[])",
  "function getFollowing(address user) view returns (address[])"
];

// IPFS configuration - for a real implementation, connect to a proper IPFS service
const ipfsGateway = "https://ipfs.io/ipfs/";
const ipfsApiUrl = "https://api.pinata.cloud/pinning/pinFileToIPFS"; // Example using Pinata

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

// Mock function for development - this simulates IPFS uploads
const mockUploadToIPFS = async (file: File): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate a fake CID
      const fakeCID = "Qm" + Array(44).fill(0).map(() => Math.random().toString(36).charAt(2)).join('');
      resolve(fakeCID);
    }, 1000);
  });
};

// Real function for IPFS upload - would require API key for Pinata or similar service
const uploadToIPFS = async (file: File, apiKey: string, apiSecret: string): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(ipfsApiUrl, {
    method: 'POST',
    headers: {
      'pinata_api_key': apiKey,
      'pinata_secret_api_key': apiSecret,
    },
    body: formData,
  });

  const data = await response.json();
  return data.IpfsHash;
};

export const useProfileService = () => {
  const { provider, address } = useWalletContext();

  // Get contract instance
  const getForumContract = async () => {
    if (!provider) throw new Error("Wallet not connected");
    
    // Replace with the actual deployed contract address
    const contractAddress = "0x123..."; // This should be the real contract address
    
    const signer = await provider.getSigner();
    return new ethers.Contract(contractAddress, forumABI, signer);
  };

  // Check if user has profile
  const checkProfileExists = async (userAddress: string): Promise<boolean> => {
    try {
      const contract = await getForumContract();
      return await contract.hasProfile(userAddress);
    } catch (error) {
      console.error("Error checking profile:", error);
      return false;
    }
  };

  // Get user profile
  const getProfile = async (userAddress: string): Promise<ProfileData | null> => {
    try {
      const contract = await getForumContract();
      const profileExists = await contract.hasProfile(userAddress);
      
      if (!profileExists) return null;
      
      const profileData = await contract.getProfile(userAddress);
      
      return {
        exists: profileData.exists,
        nickname: profileData.nickname,
        profilePicture: profileData.profileCID ? `${ipfsGateway}${profileData.profileCID}` : "",
        coverPhoto: profileData.coverCID ? `${ipfsGateway}${profileData.coverCID}` : "",
        bio: profileData.bioCID ? `${ipfsGateway}${profileData.bioCID}` : "",
        likesReceived: profileData.likesReceived,
        likesGiven: profileData.likesGiven,
        followers: profileData.followers,
        following: profileData.following,
        createdAt: profileData.createdAt.toNumber(),
        updatedAt: profileData.updatedAt.toNumber()
      };
    } catch (error) {
      console.error("Error getting profile:", error);
      return null;
    }
  };

  // Create new profile
  const createProfile = async (
    nickname: string,
    profilePicture: File | null,
    coverPhoto: File | null,
    bio: string
  ): Promise<boolean> => {
    try {
      // Step 1: Upload files to IPFS
      // For development, we're using mock uploads
      // In production, use a real IPFS service
      const profileCID = profilePicture ? await mockUploadToIPFS(profilePicture) : "";
      const coverCID = coverPhoto ? await mockUploadToIPFS(coverPhoto) : "";
      
      // Upload bio to IPFS as JSON file
      const bioBlob = new Blob([JSON.stringify({ text: bio })], { type: 'application/json' });
      const bioFile = new File([bioBlob], 'bio.json');
      const bioCID = await mockUploadToIPFS(bioFile);
      
      // Step 2: Call smart contract
      const contract = await getForumContract();
      const tx = await contract.createProfile(nickname, profileCID, coverCID, bioCID);
      
      // Wait for transaction to be mined
      await tx.wait();
      return true;
      
    } catch (error) {
      console.error("Error creating profile:", error);
      return false;
    }
  };

  // Update existing profile
  const updateProfile = async (
    nickname: string,
    profilePicture: File | null,
    coverPhoto: File | null,
    bio: string
  ): Promise<boolean> => {
    try {
      // Upload only new files to IPFS if provided
      const profileCID = profilePicture ? await mockUploadToIPFS(profilePicture) : "";
      const coverCID = coverPhoto ? await mockUploadToIPFS(coverPhoto) : "";
      
      // Always update bio
      const bioBlob = new Blob([JSON.stringify({ text: bio })], { type: 'application/json' });
      const bioFile = new File([bioBlob], 'bio.json');
      const bioCID = await mockUploadToIPFS(bioFile);
      
      // Call smart contract
      const contract = await getForumContract();
      const tx = await contract.updateProfile(nickname, profileCID, coverCID, bioCID);
      
      // Wait for transaction to be mined
      await tx.wait();
      return true;
      
    } catch (error) {
      console.error("Error updating profile:", error);
      return false;
    }
  };

  // Follow user
  const followUser = async (userToFollow: string): Promise<boolean> => {
    try {
      const contract = await getForumContract();
      const tx = await contract.followUser(userToFollow);
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Error following user:", error);
      return false;
    }
  };

  // Unfollow user
  const unfollowUser = async (userToUnfollow: string): Promise<boolean> => {
    try {
      const contract = await getForumContract();
      const tx = await contract.unfollowUser(userToUnfollow);
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Error unfollowing user:", error);
      return false;
    }
  };

  // Get followers
  const getFollowers = async (userAddress: string): Promise<string[]> => {
    try {
      const contract = await getForumContract();
      return await contract.getFollowers(userAddress);
    } catch (error) {
      console.error("Error getting followers:", error);
      return [];
    }
  };

  // Get following
  const getFollowing = async (userAddress: string): Promise<string[]> => {
    try {
      const contract = await getForumContract();
      return await contract.getFollowing(userAddress);
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
