"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useWalletContext } from '@/contexts/WalletContext';
import { User, UserPlus, UserCheck, ExternalLink } from 'lucide-react';
import { BrowserProvider, Contract } from 'ethers';
import { forumAddress, forumABI } from '@/contracts/DecentralizedForum_V3.3';

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
        const contract = new Contract(forumAddress, forumABI, provider);
        
        // Use isFollowing from main contract (follower, followed)
        const following = await contract.isFollowing(currentUserAddress, address);
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
    
    // Check if target user has a profile (required by contract)
    if (!profile?.exists) {
      alert('This user has not created a profile yet. You can only follow users with an active profile.');
      setShowMenu(false);
      return;
    }
    
    setFollowLoading(true);
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        alert('Please connect your wallet');
        return;
      }
      
      const provider = new BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(forumAddress, forumABI, signer);
      
      if (isFollowing) {
        // Unfollow user
        const tx = await contract.unfollowUser(address);
        await tx.wait();
        setIsFollowing(false);
      } else {
        // Follow user
        const tx = await contract.followUser(address);
        await tx.wait();
        setIsFollowing(true);
      }
    } catch (error: any) {
      console.error('Error following/unfollowing user:', error);
      // Show user-friendly error
      if (error.reason) {
        alert(`Transaction failed: ${error.reason}`);
      } else if (error.message?.includes('user rejected')) {
        // User cancelled, no alert needed
      } else {
        alert('Transaction failed. Please try again.');
      }
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
            disabled={followLoading || !profile?.exists}
            title={!profile?.exists ? 'This user has not created a profile yet' : ''}
            className="w-full px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {followLoading ? (
              <span className="animate-pulse text-slate-500">Loading...</span>
            ) : !profile?.exists ? (
              <>
                <UserPlus className="w-4 h-4 text-slate-400" />
                <span className="text-slate-400">No profile</span>
              </>
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
      
      {showNickname && (
        <Link
          href={`/profile?address=${address}`}
          className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200 text-xs font-medium"
        >
          <span>
            {profile?.nickname
              ? profile.nickname
              : `${address.substring(0, 6)}...${address.substring(address.length - 4)}`}
          </span>
        </Link>
      )}
    </div>
  );
};
