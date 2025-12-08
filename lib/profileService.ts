"use client";

import { Contract } from "ethers";
import { useCallback } from "react";
import { useWalletContext } from "@/contexts/WalletContext";
import { forumAddress, forumABI } from "@/contracts/DecentralizedForum_V3.3";

// Transaction status callback type
export type TransactionStatusCallback = (status: 'uploading' | 'signing' | 'pending' | 'confirmed' | 'failed', message?: string) => void;

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

    return data.IpfsHash;
  } catch (error) {
    console.error("Error uploading to IPFS:", error);
    throw error;
  }
};

export const useProfileService = () => {
  const { provider, address } = useWalletContext();

  // Check if user has profile on blockchain
  const checkProfileExists = useCallback(async (userAddress: string): Promise<boolean> => {
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) return false;

      const { BrowserProvider } = await import('ethers');
      const browserProvider = new BrowserProvider(ethereum);
      const contract = new Contract(forumAddress, forumABI, browserProvider);

      const hasProfile = await contract.hasProfile(userAddress);

      return hasProfile;
    } catch (error) {
      console.error("Error checking profile:", error);
      return false;
    }
  }, []);

  // Get user profile from blockchain + IPFS
  const getProfile = useCallback(async (userAddress: string): Promise<ProfileData | null> => {
    try {


      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        return {
          exists: false,
          nickname: "",
          profilePicture: "",
          coverPhoto: "",
          bio: "Web3 enthusiast and NodeSpeak community member",
          likesReceived: 0,
          likesGiven: 0,
          followers: 0,
          following: 0,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
      }

      const { BrowserProvider } = await import('ethers');
      const browserProvider = new BrowserProvider(ethereum);
      const contract = new Contract(forumAddress, forumABI, browserProvider);

      // Check if profile exists on-chain
      const hasProfile = await contract.hasProfile(userAddress);


      if (!hasProfile) {
        return {
          exists: false,
          nickname: "",
          profilePicture: "",
          coverPhoto: "",
          bio: "Web3 enthusiast and NodeSpeak community member",
          likesReceived: 0,
          likesGiven: 0,
          followers: 0,
          following: 0,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
      }

      const onChainProfile = await contract.getProfile(userAddress);


      // Fetch bio from IPFS if bioCID exists
      let bio = "Web3 enthusiast";
      if (onChainProfile.bioCID && onChainProfile.bioCID.length > 0) {
        try {
          const bioResponse = await fetch(`${ipfsGateway}${onChainProfile.bioCID}`);
          bio = await bioResponse.text();
        } catch (e) {

        }
      }

      return {
        exists: true,
        nickname: onChainProfile.nickname || "",
        profilePicture: onChainProfile.profileCID ? `${ipfsGateway}${onChainProfile.profileCID}` : "",
        coverPhoto: onChainProfile.coverCID ? `${ipfsGateway}${onChainProfile.coverCID}` : "",
        bio: bio,
        likesReceived: Number(onChainProfile.likesReceived) || 0,
        likesGiven: Number(onChainProfile.likesGiven) || 0,
        followers: Number(onChainProfile.followerCount) || 0,
        following: Number(onChainProfile.followingCount) || 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
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
    bio: string,
    onStatusChange?: TransactionStatusCallback
  ): Promise<boolean> => {




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
      onStatusChange?.('uploading', 'Uploading files to IPFS...');

      let profileCID = "";
      let coverCID = "";
      let bioCID = "";

      if (profilePicture) {

        profileCID = await uploadToIPFS(profilePicture, 'profile-picture.jpg');

      }

      if (coverPhoto) {

        coverCID = await uploadToIPFS(coverPhoto, 'cover-photo.jpg');

      }

      // Upload bio to IPFS
      if (bio) {

        const bioBlob = new Blob([bio], { type: 'text/plain' });
        bioCID = await uploadToIPFS(bioBlob, 'bio.txt');

      }






      // Step 2: Send transaction to smart contract
      onStatusChange?.('signing', 'Please sign the transaction in MetaMask...');

      const signer = await provider.getSigner();
      const contract = new Contract(forumAddress, forumABI, signer);

      try {
        // Estimate gas first to catch potential errors

        await contract.createProfile.estimateGas(
          nickname,
          profileCID,
          coverCID,
          bioCID
        );

        // If estimation succeeds, proceed with the transaction

        const tx = await contract.createProfile(
          nickname,
          profileCID,
          coverCID,
          bioCID
        );


        onStatusChange?.('pending', `Transaction pending: ${tx.hash.slice(0, 10)}...`);

        // Wait for transaction confirmation
        await tx.wait();


        onStatusChange?.('confirmed', 'Profile created successfully on blockchain!');

      } catch (estimateError: any) {
        console.error(">>> Gas estimation or transaction error:", estimateError);
        onStatusChange?.('failed', estimateError.message || 'Transaction failed');
        throw estimateError;
      }

      return true;

    } catch (error: any) {
      console.error("Error creating profile:", error);
      onStatusChange?.('failed', error.message || 'Error creating profile');
      return false;
    }
  }, [address, provider]);

  // Update existing profile
  const updateProfile = useCallback(async (
    nickname: string,
    profilePicture: File | null,
    coverPhoto: File | null,
    bio: string,
    onStatusChange?: TransactionStatusCallback
  ): Promise<boolean> => {
    try {
      if (!address) throw new Error("No wallet address");
      if (!provider) throw new Error("No provider available");

      // Get existing profile from blockchain
      const { BrowserProvider } = await import('ethers');
      const ethereum = (window as any).ethereum;
      const browserProvider = new BrowserProvider(ethereum);
      const readContract = new Contract(forumAddress, forumABI, browserProvider);

      let existingProfileCID = "";
      let existingCoverCID = "";
      let existingBioCID = "";

      try {
        const existingProfile = await readContract.getProfile(address);
        existingProfileCID = existingProfile.profileCID || "";
        existingCoverCID = existingProfile.coverCID || "";
        existingBioCID = existingProfile.bioCID || "";
      } catch (e) {

      }

      // Step 1: Upload files to IPFS (only new files)
      onStatusChange?.('uploading', 'Uploading files to IPFS...');

      let profileCID = existingProfileCID;
      let coverCID = existingCoverCID;
      let bioCID = existingBioCID;

      if (profilePicture) {

        profileCID = await uploadToIPFS(profilePicture, 'profile-picture.jpg');

      }

      if (coverPhoto) {

        coverCID = await uploadToIPFS(coverPhoto, 'cover-photo.jpg');

      }

      // Always upload bio to IPFS
      if (bio) {

        const bioBlob = new Blob([bio], { type: 'text/plain' });
        bioCID = await uploadToIPFS(bioBlob, 'bio.txt');

      }



      // Step 2: Send transaction to smart contract
      onStatusChange?.('signing', 'Please sign the transaction in MetaMask...');

      const signer = await provider.getSigner();
      const contract = new Contract(forumAddress, forumABI, signer);

      try {
        // Estimate gas first to catch potential errors

        await contract.updateProfile.estimateGas(
          nickname,
          profileCID,
          coverCID,
          bioCID
        );

        // If estimation succeeds, proceed with the transaction

        const tx = await contract.updateProfile(
          nickname,
          profileCID,
          coverCID,
          bioCID
        );


        onStatusChange?.('pending', `Transaction pending: ${tx.hash.slice(0, 10)}...`);

        // Wait for transaction confirmation
        await tx.wait();


        onStatusChange?.('confirmed', 'Profile updated successfully on blockchain!');

      } catch (estimateError: any) {
        console.error(">>> Gas estimation or transaction error:", estimateError);
        
        // Check for cooldown error
        const errorMessage = estimateError.message || estimateError.reason || '';
        if (errorMessage.toLowerCase().includes('cooldown')) {
          onStatusChange?.('failed', 'Profile update cooldown active. Please wait a few minutes before updating your profile again.');
          throw new Error('Profile update cooldown active. Please wait a few minutes before updating your profile again.');
        }
        
        onStatusChange?.('failed', estimateError.message || 'Transaction failed');
        throw estimateError;
      }

      return true;

    } catch (error: any) {
      console.error("Error updating profile:", error);
      
      // Check for cooldown error in outer catch as well
      const errorMessage = error.message || error.reason || '';
      if (errorMessage.toLowerCase().includes('cooldown')) {
        onStatusChange?.('failed', 'Profile update cooldown active. Please wait a few minutes before updating your profile again.');
      } else {
        onStatusChange?.('failed', error.message || 'Error updating profile');
      }
      return false;
    }
  }, [address, provider]);

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
