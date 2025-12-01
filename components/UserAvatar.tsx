"use client";

import React from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { User } from 'lucide-react';

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
  const { profile, loading } = useUserProfile(address);

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

  if (loading) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-[var(--matrix-green)]/20 animate-pulse ${className}`} />
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden border border-[var(--matrix-green)] flex items-center justify-center bg-black`}>
        {profile?.profilePicture ? (
          <img 
            src={profile.profilePicture} 
            alt={profile.nickname}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to default icon if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              if (target.nextSibling) {
                (target.nextSibling as HTMLElement).style.display = 'block';
              }
            }}
          />
        ) : (
          <User className={`${iconSizes[size]} text-[var(--matrix-green)]`} />
        )}
      </div>
      {showNickname && profile && (
        <span className="text-[var(--matrix-green)] text-sm font-mono">
          {profile.nickname}
        </span>
      )}
    </div>
  );
};
