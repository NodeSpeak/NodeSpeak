"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  const avatarRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  
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

  const updateMenuPosition = useCallback(() => {
    if (avatarRef.current) {
      const rect = avatarRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX
      });
    }
  }, []);

  const handleAvatarClick = () => {
    if (!isCurrentUser && currentUserAddress) {
      updateMenuPosition();
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
        ref={avatarRef}
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
      
      {/* User Menu - rendered via portal to avoid overflow issues */}
      {showMenu && !isCurrentUser && typeof document !== 'undefined' && createPortal(
        <div 
          ref={menuRef}
          style={{ 
            position: 'absolute',
            top: menuPosition.top,
            left: menuPosition.left,
            zIndex: 9999
          }}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 min-w-[180px] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {/* Menu Header */}
          <div className="px-4 py-2.5 bg-gradient-to-r from-slate-50 to-white dark:from-slate-700 dark:to-slate-800 border-b border-slate-100 dark:border-slate-700">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Actions</p>
          </div>
          
          {/* View Profile Button */}
          <button
            onClick={() => {
              router.push(`/profile?address=${address}`);
              setShowMenu(false);
            }}
            className="w-full px-4 py-3 text-left text-slate-700 dark:text-slate-200 hover:bg-gradient-to-r hover:from-sky-50 hover:to-white dark:hover:from-sky-900/30 dark:hover:to-slate-800 flex items-center gap-3 text-sm font-medium transition-all duration-200 group"
          >
            <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center group-hover:bg-sky-200 dark:group-hover:bg-sky-800/50 transition-colors">
              <ExternalLink className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            </div>
            <span className="group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors">View Profile</span>
          </button>
          
          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-600 to-transparent mx-3" />
          
          {/* Follow/Unfollow Button */}
          <button
            onClick={handleFollow}
            disabled={followLoading || !profile?.exists}
            title={!profile?.exists ? 'This user has not created a profile yet' : ''}
            className="w-full px-4 py-3 text-left text-slate-700 dark:text-slate-200 hover:bg-gradient-to-r hover:from-slate-50 hover:to-white dark:hover:from-slate-700 dark:hover:to-slate-800 flex items-center gap-3 text-sm font-medium transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            {followLoading ? (
              <>
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-500 border-t-slate-600 dark:border-t-slate-300 rounded-full animate-spin" />
                </div>
                <span className="text-slate-500 dark:text-slate-400">Loading...</span>
              </>
            ) : !profile?.exists ? (
              <>
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                </div>
                <span className="text-slate-400 dark:text-slate-500">No profile</span>
              </>
            ) : isFollowing ? (
              <>
                <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center group-hover:bg-red-200 dark:group-hover:bg-red-800/50 transition-colors">
                  <UserCheck className="w-4 h-4 text-red-500 dark:text-red-400" />
                </div>
                <span className="text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors">Unfollow</span>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/50 transition-colors">
                  <UserPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">Follow</span>
              </>
            )}
          </button>
        </div>,
        document.body
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
