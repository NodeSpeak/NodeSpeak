"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useWalletContext } from '@/contexts/WalletContext';
import { User, UserPlus, UserCheck, ExternalLink } from 'lucide-react';
import { BrowserProvider, Contract } from 'ethers';
import { forumAddress, forumABI } from '@/contracts/DecentralizedForum_Commuties_arbitrum';

// ABI for ForumProfileManager (only the functions we need)
const profileManagerABI = [
  {
    "inputs": [{ "internalType": "address", "name": "userToFollow", "type": "address" }],
    "name": "followUser",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "userToUnfollow", "type": "address" }],
    "name": "unfollowUser",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "", "type": "address" },
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "name": "isFollowing",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  }
];

interface UserAvatarProps {
  address: string;
  size?: 'sm' | 'md' | 'lg';
  showNickname?: boolean;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  address, 
  size = 'md', 
  showNickname = false,
  className = ''
}) => {
  const router = useRouter();
  const { profile, loading } = useUserProfile(address);
  const { address: currentUserAddress } = useWalletContext();
  const [showMenu, setShowMenu] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Reset image error when profile changes
  useEffect(() => {
    setImageError(false);
  }, [profile?.profilePicture]);

  // Check if this is the current user's avatar
  const isCurrentUser = currentUserAddress?.toLowerCase() === address?.toLowerCase();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  // Check if current user is following this user
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!currentUserAddress || !address || isCurrentUser) return;
      
      try {
        const ethereum = (window as any).ethereum;
        if (!ethereum) return;
        
        const provider = new BrowserProvider(ethereum);
        
        // Get profileManager address from main contract
        const mainContract = new Contract(forumAddress, forumABI, provider);
        const profileManagerAddress = await mainContract.profileManager();
        
        // Call profileManager directly for isFollowing check
        const profileManager = new Contract(profileManagerAddress, profileManagerABI, provider);
        const following = await profileManager.isFollowing(currentUserAddress, address);
        setIsFollowing(following);
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };
    
    checkFollowStatus();
  }, [currentUserAddress, address, isCurrentUser]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFollow = async () => {
    if (!currentUserAddress || !address) return;
    
    setFollowLoading(true);
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) return;
      
      const provider = new BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      
      // Get profileManager address from main contract
      const mainContract = new Contract(forumAddress, forumABI, provider);
      const profileManagerAddress = await mainContract.profileManager();
      
      // Call profileManager directly - this allows following ANY address
      // even if they don't have a profile created
      const profileManager = new Contract(profileManagerAddress, profileManagerABI, signer);
      
      if (isFollowing) {
        const tx = await profileManager.unfollowUser(address);
        await tx.wait();
        setIsFollowing(false);
      } else {
        const tx = await profileManager.followUser(address);
        await tx.wait();
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
    } finally {
      setFollowLoading(false);
      setShowMenu(false);
    }
  };

  const handleAvatarClick = () => {
    if (!isCurrentUser && currentUserAddress) {
      setShowMenu(!showMenu);
    }
  };

  if (loading) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-[var(--matrix-green)]/20 animate-pulse ${className}`} />
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className} relative`} ref={menuRef}>
      <div 
        className={`${sizeClasses[size]} rounded-full overflow-hidden border border-[var(--matrix-green)] flex items-center justify-center bg-black ${!isCurrentUser && currentUserAddress ? 'cursor-pointer hover:border-[var(--matrix-green)]/80' : ''}`}
        onClick={handleAvatarClick}
      >
        {profile?.profilePicture && !imageError ? (
          <img 
            src={profile.profilePicture} 
            alt={profile.nickname || 'User'}
            className="w-full h-full object-cover"
            onError={() => {
              console.log('Image failed to load:', profile.profilePicture);
              setImageError(true);
            }}
          />
        ) : (
          <User className={`${iconSizes[size]} text-[var(--matrix-green)]`} />
        )}
      </div>
      
      {/* User Menu - only for other users */}
      {showMenu && !isCurrentUser && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-slate-200 rounded-lg shadow-lg min-w-[160px] overflow-hidden">
          {/* View Profile Button */}
          <button
            onClick={() => {
              router.push(`/profile?address=${address}`);
              setShowMenu(false);
            }}
            className="w-full px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 text-sm transition-colors border-b border-slate-100"
          >
            <ExternalLink className="w-4 h-4 text-slate-500" />
            View Profile
          </button>
          {/* Follow/Unfollow Button */}
          <button
            onClick={handleFollow}
            disabled={followLoading}
            className="w-full px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {followLoading ? (
              <span className="animate-pulse text-slate-500">Loading...</span>
            ) : isFollowing ? (
              <>
                <UserCheck className="w-4 h-4 text-red-500" />
                <span className="text-red-600">Unfollow</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 text-sky-500" />
                <span className="text-sky-600">Follow</span>
              </>
            )}
          </button>
        </div>
      )}
      
      {showNickname && profile && (
        <span className="text-[var(--matrix-green)] text-sm font-mono">
          {profile.nickname}
        </span>
      )}
    </div>
  );
};
