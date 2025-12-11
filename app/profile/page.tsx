"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useWalletContext } from "@/contexts/WalletContext";
import { useAdminContext } from "@/contexts/AdminContext";
import { useProfileService } from "@/lib/profileService";
import { Button } from "@/components/ui/button";
import { User, ArrowLeft, Edit3, MessageSquare, Heart, UserPlus, UserCheck, Shield, EyeOff, ChevronDown, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { BrowserProvider, Contract } from "ethers";
import { forumAddress, forumABI } from "@/contracts/DecentralizedForum_V3.3";
import { fetchText, fetchJSON } from "@/lib/ipfsClient";

// Note: followUser, unfollowUser, and isFollowing are available directly on the main forum contract

// Interface for recent activity
interface RecentActivity {
  type: 'post' | 'comment';
  content: string;
  communityName: string;
  timestamp: number;
  postId?: number;
  topic?: string;
}

// Interface for user communities
interface UserCommunity {
  id: number;
  name: string;
  photo?: string;
  memberCount: number;
}

// Helper function to shorten Ethereum addresses
function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  
  // Ensure the address has enough length
  if (address.length < chars * 2 + 2) {
    return address;
  }
  
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address: currentUserAddress, ensName, isConnected } = useWalletContext();
  const { isAdmin, hideUser, isUserHidden } = useAdminContext();
  const profileService = useProfileService();
  
  // Get target address from URL param or use current user's address
  const targetAddress = searchParams.get('address') || currentUserAddress;
  const isOwnProfile = !searchParams.get('address') || 
    (currentUserAddress && searchParams.get('address')?.toLowerCase() === currentUserAddress.toLowerCase());
  
  const [isLoading, setIsLoading] = useState(true);
  const activityLoadedRef = useRef(false);
  const [profileExists, setProfileExists] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    nickname: "",
    bio: "",
    profilePicture: "",
    coverPhoto: "",
    likesReceived: 0,
    likesGiven: 0,
    followers: 0,
    following: 0,
    postCount: 0,
    memberSince: ""
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [userCommunities, setUserCommunities] = useState<UserCommunity[]>([]);
  
  // Followers/Following dropdown states
  const [showFollowersMenu, setShowFollowersMenu] = useState(false);
  const [showFollowingMenu, setShowFollowingMenu] = useState(false);
  const [followersList, setFollowersList] = useState<string[]>([]);
  const [followingList, setFollowingList] = useState<string[]>([]);
  const [followersProfiles, setFollowersProfiles] = useState<Map<string, {nickname: string, profilePicture: string}>>(new Map());
  const [followingProfiles, setFollowingProfiles] = useState<Map<string, {nickname: string, profilePicture: string}>>(new Map());
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const followersMenuRef = useRef<HTMLDivElement>(null);
  const followingMenuRef = useRef<HTMLDivElement>(null);

  // Check follow status for other users
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!currentUserAddress || !targetAddress || isOwnProfile) return;
      
      try {
        const ethereum = (window as any).ethereum;
        if (!ethereum) return;
        
        const provider = new BrowserProvider(ethereum);
        const contract = new Contract(forumAddress, forumABI, provider);
        
        // Use isFollowing from main contract (follower, followed)
        const following = await contract.isFollowing(currentUserAddress, targetAddress);
        setIsFollowing(following);
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };
    
    checkFollowStatus();
  }, [currentUserAddress, targetAddress, isOwnProfile]);

  // Handle follow/unfollow
  const handleFollow = async () => {
    if (!currentUserAddress || !targetAddress) return;
    
    // Check if target user has a profile (required by contract)
    if (!profileExists) {
      alert('This user has not created a profile yet. You can only follow users with an active profile.');
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
        const tx = await contract.unfollowUser(targetAddress);
        await tx.wait();
        setIsFollowing(false);
        setProfileData(prev => ({ ...prev, followers: Math.max(0, prev.followers - 1) }));
      } else {
        // Follow user
        const tx = await contract.followUser(targetAddress);
        await tx.wait();
        setIsFollowing(true);
        setProfileData(prev => ({ ...prev, followers: prev.followers + 1 }));
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
    }
  };

  // Load followers list
  const loadFollowers = async () => {
    if (!targetAddress || loadingFollowers) return;
    
    setLoadingFollowers(true);
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) return;
      
      const provider = new BrowserProvider(ethereum);
      const contract = new Contract(forumAddress, forumABI, provider);
      
      const followers: string[] = await contract.getFollowers(targetAddress);
      console.log('Loaded followers for', targetAddress, ':', followers);
      setFollowersList(followers);
      
      // Load profiles for each follower
      const profilesMap = new Map<string, {nickname: string, profilePicture: string}>();
      for (const addr of followers) {
        try {
          const profile = await profileService.getProfile(addr);
          if (profile) {
            profilesMap.set(addr.toLowerCase(), {
              nickname: profile.nickname || '',
              profilePicture: profile.profilePicture || ''
            });
          }
        } catch (e) {
          console.error('Error loading follower profile:', e);
        }
      }
      setFollowersProfiles(profilesMap);
    } catch (error) {
      console.error('Error loading followers:', error);
    } finally {
      setLoadingFollowers(false);
    }
  };

  // Load following list
  const loadFollowing = async () => {
    if (!targetAddress || loadingFollowing) return;
    
    setLoadingFollowing(true);
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) return;
      
      const provider = new BrowserProvider(ethereum);
      const contract = new Contract(forumAddress, forumABI, provider);
      
      const following: string[] = await contract.getFollowing(targetAddress);
      console.log('Loaded following for', targetAddress, ':', following);
      setFollowingList(following);
      
      // Load profiles for each following
      const profilesMap = new Map<string, {nickname: string, profilePicture: string}>();
      for (const addr of following) {
        try {
          const profile = await profileService.getProfile(addr);
          if (profile) {
            profilesMap.set(addr.toLowerCase(), {
              nickname: profile.nickname || '',
              profilePicture: profile.profilePicture || ''
            });
          }
        } catch (e) {
          console.error('Error loading following profile:', e);
        }
      }
      setFollowingProfiles(profilesMap);
    } catch (error) {
      console.error('Error loading following:', error);
    } finally {
      setLoadingFollowing(false);
    }
  };

  // Handle followers menu toggle
  const handleFollowersClick = () => {
    if (!showFollowersMenu) {
      loadFollowers();
    }
    setShowFollowersMenu(!showFollowersMenu);
    setShowFollowingMenu(false);
  };

  // Handle following menu toggle
  const handleFollowingClick = () => {
    if (!showFollowingMenu) {
      loadFollowing();
    }
    setShowFollowingMenu(!showFollowingMenu);
    setShowFollowersMenu(false);
  };

  // Reset followers/following data when target address changes
  useEffect(() => {
    setFollowersList([]);
    setFollowingList([]);
    setFollowersProfiles(new Map());
    setFollowingProfiles(new Map());
    setShowFollowersMenu(false);
    setShowFollowingMenu(false);
  }, [targetAddress]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (followersMenuRef.current && !followersMenuRef.current.contains(event.target as Node)) {
        setShowFollowersMenu(false);
      }
      if (followingMenuRef.current && !followingMenuRef.current.contains(event.target as Node)) {
        setShowFollowingMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Only redirect if viewing own profile and not connected
    if (isOwnProfile && !isConnected) {
      router.push('/');
      return;
    }

    // Load profile data from blockchain
    const loadData = async () => {
      if (!targetAddress) {
        setIsLoading(false);
        return;
      }

      try {
        // Get profile from blockchain/IPFS
        const profile = await profileService.getProfile(targetAddress);
        
        // Always get post count from blockchain
        let postCount = 0;
        let myPosts: any[] = [];
        let allPosts: any[] = [];
        const ethereum = (window as any).ethereum;
        
        if (ethereum) {
          const browserProvider = new BrowserProvider(ethereum);
          const contract = new Contract(forumAddress, forumABI, browserProvider);
          
          allPosts = await contract.getActivePosts();
          myPosts = allPosts.filter((post: any) => 
            post.author.toLowerCase() === targetAddress.toLowerCase()
          );
          postCount = myPosts.length;
        }
        
        if (profile) {
          setProfileExists(profile.exists);
          setProfileData({
            nickname: profile.nickname || "",
            bio: profile.bio || "Web3 enthusiast and NodeSpeak community member",
            profilePicture: profile.profilePicture || "",
            coverPhoto: profile.coverPhoto || "",
            likesReceived: profile.likesReceived || 0,
            likesGiven: profile.likesGiven || 0,
            followers: profile.followers || 0,
            following: profile.following || 0,
            postCount: postCount,
            memberSince: profile.createdAt 
              ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) 
              : "Recently joined"
          });
        }

        // Load user's activity (comments, etc.) - only once and if we have posts
        if (ethereum && allPosts.length > 0 && !activityLoadedRef.current) {
          activityLoadedRef.current = true; // Mark activity as loaded to prevent re-runs
          try {
            const browserProvider = new BrowserProvider(ethereum);
            const contract = new Contract(forumAddress, forumABI, browserProvider);
            
            // Cache for community names (local to this effect)
            const communityCache: Record<string, string> = {};
            
            // Helper to fetch from IPFS - uses centralized ipfsClient
            const fetchFromIPFS = async (cid: string): Promise<string | null> => {
              if (!cid) return null;
              try {
                return await fetchText(cid, { useCache: true });
              } catch {
                return null;
              }
            };
            
            // Helper to get community name
            const getCommunityName = async (communityId: number): Promise<string> => {
              const cacheKey = communityId.toString();
              if (communityCache[cacheKey]) return communityCache[cacheKey];
              
              try {
                const community = await contract.getCommunity(communityId);
                if (community.contentCID) {
                  const text = await fetchFromIPFS(community.contentCID);
                  if (text) {
                    try {
                      const data = JSON.parse(text);
                      communityCache[cacheKey] = data.name || `Community #${communityId}`;
                    } catch {
                      communityCache[cacheKey] = `Community #${communityId}`;
                    }
                  } else {
                    communityCache[cacheKey] = `Community #${communityId}`;
                  }
                } else {
                  communityCache[cacheKey] = `Community #${communityId}`;
                }
              } catch {
                communityCache[cacheKey] = `Community #${communityId}`;
              }
              return communityCache[cacheKey];
            };
            
            // Helper to get post content from IPFS
            const getPostContent = async (contentCID: string): Promise<string> => {
              if (!contentCID) return '';
              
              try {
                const text = await fetchFromIPFS(contentCID);
                if (!text) return '';
                
                // Try to parse as JSON first (some posts store content in JSON format)
                let content = text;
                try {
                  const json = JSON.parse(text);
                  content = json.content || json.body || json.text || json.description || text;
                } catch {
                  content = text;
                }
                
                // Strip HTML tags for preview
                const stripped = content.replace(/<[^>]*>/g, '').trim();
                return stripped.length > 100 ? stripped.substring(0, 100) + '...' : stripped;
              } catch (e) {
                console.log('Error fetching post content:', e);
                return '';
              }
            };
            
            // Create activities array
            const activities: RecentActivity[] = [];
            
            // Add user's posts
            for (const post of myPosts.slice(0, 5)) {
              const communityName = await getCommunityName(Number(post.communityId));
              const content = await getPostContent(post.contentCID);
              
              activities.push({
                type: 'post',
                content: content,
                communityName: communityName,
                timestamp: Number(post.timestamp) * 1000,
                postId: Number(post.id),
                topic: post.topic
              });
            }
            
            // Find user's comments - only check posts with comments to reduce requests
            const postsWithComments = allPosts
              .filter((p: any) => Number(p.commentCount) > 0)
              .slice(0, 10); // Limit to 10 posts
            
            for (const post of postsWithComments) {
              try {
                const comments = await contract.getComments(Number(post.id));
                const myComments = comments.filter((c: any) => 
                  c.author.toLowerCase() === targetAddress.toLowerCase() && c.isActive
                );
                
                for (const comment of myComments.slice(0, 3)) { // Max 3 comments per post
                  const communityName = await getCommunityName(Number(post.communityId));
                  const content = comment.content.replace(/<[^>]*>/g, '').trim();
                  const truncated = content.length > 100 
                    ? content.substring(0, 100) + '...' 
                    : content;
                  
                  activities.push({
                    type: 'comment',
                    content: truncated,
                    communityName: communityName,
                    timestamp: Number(comment.timestamp) * 1000,
                    postId: Number(post.id)
                  });
                }
              } catch {
                // Skip if can't load comments for this post
              }
            }
            
            // Sort by timestamp (newest first) and take top 10
            activities.sort((a, b) => b.timestamp - a.timestamp);
            setRecentActivity(activities.slice(0, 10));
            
            // Load user's communities
            try {
              // Get all active communities first
              const allCommunities = await contract.getActiveCommunities();
              const communities: UserCommunity[] = [];
              
              for (const community of allCommunities) {
                try {
                  const communityId = Number(community.id);
                  // Check if user is member using isMember(communityId, address)
                  const isMember = await contract.isMember(communityId, targetAddress);
                  // Also check if user is creator
                  const isCreator = community.creator.toLowerCase() === targetAddress.toLowerCase();
                  
                  if (isMember || isCreator) {
                    const memberCount = await contract.getCommunityMemberCount(communityId);
                    
                    let name = `Community #${communityId}`;
                    let photo = '';
                    
                    // Get community name from IPFS
                    if (community.contentCID) {
                      const text = await fetchFromIPFS(community.contentCID);
                      if (text) {
                        try {
                          const data = JSON.parse(text);
                          name = data.name || name;
                        } catch {}
                      }
                    }
                    
                    if (community.profileCID) {
                      photo = community.profileCID;
                    }
                    
                    communities.push({
                      id: communityId,
                      name,
                      photo,
                      memberCount: Number(memberCount)
                    });
                  }
                } catch {
                  // Skip this community
                }
              }
              
              setUserCommunities(communities);
            } catch (e) {
              console.log("Could not load communities:", e);
            }
          } catch (e) {
            console.log("Could not load activity:", e);
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [targetAddress, isConnected, isOwnProfile, router, profileService]);

  // Reset loaded state when target address changes
  useEffect(() => {
    // Reset activity ref when address changes
    activityLoadedRef.current = false;
    setRecentActivity([]);
    setUserCommunities([]);
  }, [targetAddress]);

  // Create a blinking cursor effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      const cursors = document.querySelectorAll('.cursor');
      cursors.forEach(cursor => {
        cursor.classList.toggle('opacity-0');
      });
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  // Get display name - use ensName only for own profile
  const displayName = (isOwnProfile ? ensName : null) || profileData.nickname || (targetAddress ? shortenAddress(targetAddress) : "");
  const fullAddress = targetAddress || "";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f5f7ff] via-[#fdfbff] to-[#e6f0ff] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="text-lg text-slate-700 dark:text-slate-200 font-medium">Loading profile...</p>
          <div className="mt-4 flex space-x-2">
            <div className="h-2 w-2 bg-sky-500 rounded-full animate-pulse"></div>
            <div className="h-2 w-2 bg-sky-500 rounded-full animate-pulse delay-150"></div>
            <div className="h-2 w-2 bg-sky-500 rounded-full animate-pulse delay-300"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f7ff] via-[#fdfbff] to-[#e6f0ff] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Banner if no profile exists */}
        {!profileExists && isOwnProfile && (
          <div className="mb-6 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-700 dark:text-amber-300 font-semibold">⚠️ Profile not found on blockchain</p>
                <p className="text-amber-600 dark:text-amber-400 text-sm mt-1">
                  Create your on-chain profile to personalize your NodeSpeak experience.
                </p>
              </div>
              <Button 
                onClick={() => router.push('/profile/edit')}
                className="bg-amber-100 hover:bg-amber-200 text-amber-700 border border-amber-300 rounded-full px-4 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 dark:text-amber-200 dark:border-amber-700"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Create Profile
              </Button>
            </div>
          </div>
        )}
        
        {!profileExists && !isOwnProfile && (
          <div className="mb-6 rounded-2xl bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 p-5">
            <p className="text-sky-700 dark:text-sky-300">
              This user has not created a profile yet. You can still follow them.
            </p>
          </div>
        )}

        {/* Profile Header with Cover Photo Background */}
        <div className="mb-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden relative">
          {/* Cover Photo as Full Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-sky-100 to-indigo-100 dark:from-slate-800 dark:to-slate-700">
            {profileData.coverPhoto && (
              <ImageWithFallback
                cid={profileData.coverPhoto}
                alt="Cover"
                className="w-full h-full object-cover"
                fallback={<div className="w-full h-full bg-gradient-to-br from-sky-100 to-indigo-100 dark:from-slate-800 dark:to-slate-700" />}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-white/30 dark:via-slate-900/10 dark:to-slate-900/40"></div>
          </div>
          
          {/* Profile Content - Overlaid on cover */}
          <div className="relative p-6 pt-8">
            {/* User Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Avatar Section */}
              <div className="flex justify-center md:justify-start">
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl bg-slate-50 dark:bg-slate-700">
                  {profileData.profilePicture ? (
                    <ImageWithFallback
                      cid={profileData.profilePicture}
                      alt={displayName}
                      className="h-full w-full object-cover"
                      fallback={
                        <div className="h-full w-full flex items-center justify-center">
                          <User className="h-14 w-14 text-slate-400 dark:text-slate-500" />
                        </div>
                      }
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <User className="h-14 w-14 text-slate-400 dark:text-slate-500" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex justify-between mt-6 pt-4 border-t border-white/20 dark:border-slate-700">
            <Button 
              onClick={() => router.push('/foro')}
              className="bg-white/90 backdrop-blur-sm border border-white/50 text-slate-700 hover:bg-white rounded-full px-4 text-sm shadow-lg dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-600"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Forum
            </Button>
            
            <div className="flex flex-wrap gap-2">
              {isOwnProfile ? (
                <Button 
                  onClick={() => router.push('/profile/edit')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-full px-4 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 dark:border-slate-600"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : currentUserAddress ? (
                <Button 
                  onClick={handleFollow}
                  disabled={followLoading || !profileExists}
                  title={!profileExists ? 'This user has not created a profile yet' : ''}
                  className={`rounded-full px-4 text-sm shadow-lg ${isFollowing 
                    ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-200 dark:border-red-700'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500 dark:hover:bg-indigo-400'} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {followLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : isFollowing ? (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
              ) : null}
              
              {/* Botón de Moderación - Solo visible para administradores en su propio perfil */}
              {isAdmin && isOwnProfile && (
                <Button 
                  onClick={() => router.push('/admin')}
                  className="bg-red-600 text-white hover:bg-red-700 rounded-full px-4 text-sm shadow-lg"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Moderation
                </Button>
              )}
              
              {/* Botón Ocultar Usuario - Solo visible para administradores en perfil ajeno */}
              {isAdmin && !isOwnProfile && targetAddress && (
                <Button 
                  onClick={() => {
                    const displayName = profileData.nickname || shortenAddress(targetAddress);
                    if (window.confirm(`¿Estás seguro de que quieres ocultar a ${displayName}?\n\nEsto ocultará todos sus posts y comentarios.`)) {
                      // Usa la función del AdminContext
                      hideUser(
                        targetAddress, 
                        displayName,
                        prompt("Motivo opcional para ocultar al usuario:") || undefined
                      );
                      
                      // Redirecciona al usuario de vuelta al foro
                      alert(`Usuario ${displayName} ocultado correctamente.`);
                      router.push('/foro');
                    }
                  }}
                  className="bg-red-600 text-white hover:bg-red-700 rounded-full px-4 text-sm shadow-lg"
                >
                  <EyeOff className="h-4 w-4 mr-2" />
                  Ocultar Usuario
                </Button>
              )}
            </div>
          </div>
          </div>
        </div>

        {/* User Details - Outside main card */}
        <div className="mt-4 mb-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="grid grid-cols-1 gap-3">
            <div className="flex">
              <span className="text-slate-500 dark:text-slate-400 w-32 text-sm">Nickname</span>
              <span className="text-slate-900 dark:text-slate-100 font-medium">{displayName}</span>
            </div>
            <div className="flex">
              <span className="text-slate-500 dark:text-slate-400 w-32 text-sm">Address</span>
              <span className="text-slate-700 dark:text-slate-300 font-mono text-sm">{fullAddress}</span>
            </div>
            <div className="flex">
              <span className="text-slate-500 dark:text-slate-400 w-32 text-sm">Status</span>
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-full">Active</span>
            </div>
            <div className="flex">
              <span className="text-slate-500 dark:text-slate-400 w-32 text-sm">Member since</span>
              <span className="text-slate-700 dark:text-slate-300">{profileData.memberSince}</span>
            </div>
            <div className="flex">
              <span className="text-slate-500 dark:text-slate-400 w-32 text-sm">Posts</span>
              <span className="text-slate-900 dark:text-slate-100 font-medium">{profileData.postCount}</span>
            </div>
            <div className="mt-2 border-t border-slate-200 dark:border-slate-700 pt-3">
              <span className="text-slate-500 dark:text-slate-400 text-sm">Bio</span>
              <p className="text-slate-700 dark:text-slate-300 mt-1">{profileData.bio}</p>
            </div>
          </div>
        </div>
        
        {/* Stats Section - Outside card */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">Statistics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Likes Received</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{profileData.likesReceived}</p>
            </div>
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Likes Given</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{profileData.likesGiven}</p>
            </div>
            {/* Followers - Clickable with dropdown */}
            <div className="relative" ref={followersMenuRef}>
              <button
                onClick={handleFollowersClick}
                className="w-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:border-sky-300 dark:hover:border-sky-600 hover:shadow-md transition-all cursor-pointer text-left"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Followers</p>
                  <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform ${showFollowersMenu ? 'rotate-180' : ''}`} />
                </div>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{profileData.followers}</p>
              </button>
              
              {/* Followers Dropdown Menu */}
              {showFollowersMenu && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-white dark:from-slate-700 dark:to-slate-800 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Followers ({profileData.followers})</p>
                    <button onClick={() => setShowFollowersMenu(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="max-h-[320px] overflow-y-auto">
                    {loadingFollowers ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : followersList.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-slate-500 dark:text-slate-400">
                        <User className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-sm">No followers yet</p>
                      </div>
                    ) : (
                      followersList.map((addr) => {
                        const profile = followersProfiles.get(addr.toLowerCase());
                        return (
                          <Link
                            key={addr}
                            href={`/profile?address=${addr}`}
                            onClick={() => setShowFollowersMenu(false)}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                          >
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-600 flex-shrink-0 border border-slate-300 dark:border-slate-500">
                              {profile?.profilePicture ? (
                                <ImageWithFallback
                                  cid={profile.profilePicture}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  fallback={
                                    <div className="w-full h-full flex items-center justify-center">
                                      <User className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                                    </div>
                                  }
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                {profile?.nickname || shortenAddress(addr)}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{shortenAddress(addr)}</p>
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Following - Clickable with dropdown */}
            <div className="relative" ref={followingMenuRef}>
              <button
                onClick={handleFollowingClick}
                className="w-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:border-sky-300 dark:hover:border-sky-600 hover:shadow-md transition-all cursor-pointer text-left"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Following</p>
                  <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform ${showFollowingMenu ? 'rotate-180' : ''}`} />
                </div>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{profileData.following}</p>
              </button>
              
              {/* Following Dropdown Menu */}
              {showFollowingMenu && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-white dark:from-slate-700 dark:to-slate-800 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Following ({profileData.following})</p>
                    <button onClick={() => setShowFollowingMenu(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="max-h-[320px] overflow-y-auto">
                    {loadingFollowing ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : followingList.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-slate-500 dark:text-slate-400">
                        <User className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-sm">Not following anyone yet</p>
                      </div>
                    ) : (
                      followingList.map((addr) => {
                        const profile = followingProfiles.get(addr.toLowerCase());
                        return (
                          <Link
                            key={addr}
                            href={`/profile?address=${addr}`}
                            onClick={() => setShowFollowingMenu(false)}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                          >
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-600 flex-shrink-0 border border-slate-300 dark:border-slate-500">
                              {profile?.profilePicture ? (
                                <ImageWithFallback
                                  cid={profile.profilePicture}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  fallback={
                                    <div className="w-full h-full flex items-center justify-center">
                                      <User className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                                    </div>
                                  }
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                {profile?.nickname || shortenAddress(addr)}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{shortenAddress(addr)}</p>
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Communities Section */}
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Communities</h2>
          </div>
          
          <div className="p-4">
            {userCommunities.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {userCommunities.map((community) => (
                  <Link 
                    key={community.id}
                    href={`/foro?community=${community.id}`}
                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-600 flex-shrink-0">
                      {community.photo ? (
                        <ImageWithFallback
                          cid={community.photo}
                          alt={community.name}
                          className="w-full h-full object-cover"
                          fallback={
                            <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-300 text-sm font-medium">
                              {community.name.charAt(0).toUpperCase()}
                            </div>
                          }
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-300 text-sm font-medium">
                          {community.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{community.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{community.memberCount} members</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <User className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">Not a member of any community yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent Activity</h2>
          </div>
          
          <div className="min-h-[200px]">
            {recentActivity.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className="mt-1 p-2 bg-slate-100 dark:bg-slate-700 rounded-full">
                        {activity.type === 'post' && <MessageSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />}
                        {activity.type === 'comment' && <MessageSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            activity.type === 'post' 
                              ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' 
                              : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                          }`}>
                            {activity.type === 'post' ? 'Post' : 'Comment'}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 text-xs">in</span>
                          <span className="text-slate-700 dark:text-slate-300 text-xs font-medium">{activity.communityName}</span>
                          {activity.topic && (
                            <>
                              <span className="text-slate-400 dark:text-slate-500 text-xs">•</span>
                              <span className="text-slate-500 dark:text-slate-400 text-xs">{activity.topic}</span>
                            </>
                          )}
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 text-sm mt-1">
                          {activity.content}
                        </p>
                        <p className="text-slate-400 dark:text-slate-500 text-xs mt-2">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                <p className="text-slate-500 dark:text-slate-400">No activity to display yet.</p>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">Start posting to see your activity here!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
