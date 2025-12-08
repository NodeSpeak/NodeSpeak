"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWalletContext } from "@/contexts/WalletContext";
import { useAdminContext } from "@/contexts/AdminContext";
import { useProfileService } from "@/lib/profileService";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { User, ArrowLeft, Edit3, MessageSquare, Heart, UserPlus, UserCheck, Shield, EyeOff } from "lucide-react";
import { BrowserProvider, Contract } from "ethers";
import { forumAddress, forumABI } from "@/contracts/DecentralizedForum_V3.3";

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
            
            // Cache for community names and content
            const communityCache: Record<string, string> = {};
            const contentCache: Record<string, string> = {};
            
            // IPFS gateways to try (with CORS support)
            const ipfsGateways = [
              'https://cloudflare-ipfs.com/ipfs/',
              'https://ipfs.io/ipfs/',
              'https://dweb.link/ipfs/'
            ];
            
            // Helper to fetch from IPFS with fallback gateways
            const fetchFromIPFS = async (cid: string): Promise<string | null> => {
              if (contentCache[cid]) return contentCache[cid];
              
              for (const gateway of ipfsGateways) {
                try {
                  const response = await fetch(`${gateway}${cid}`, { 
                    signal: AbortSignal.timeout(5000) // 5 second timeout
                  });
                  if (response.ok) {
                    const text = await response.text();
                    contentCache[cid] = text;
                    return text;
                  }
                } catch {
                  continue; // Try next gateway
                }
              }
              return null;
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
      <div className="min-h-screen bg-gradient-to-br from-[#f5f7ff] via-[#fdfbff] to-[#e6f0ff] flex items-center justify-center">
        <div className="flex flex-col items-center bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-slate-200">
          <p className="text-lg text-slate-700 font-medium">Loading profile...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-[#f5f7ff] via-[#fdfbff] to-[#e6f0ff]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Banner if no profile exists */}
        {!profileExists && isOwnProfile && (
          <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-700 font-semibold">⚠️ Profile not found on blockchain</p>
                <p className="text-amber-600 text-sm mt-1">
                  Create your on-chain profile to personalize your NodeSpeak experience.
                </p>
              </div>
              <Button 
                onClick={() => router.push('/profile/edit')}
                className="bg-amber-100 hover:bg-amber-200 text-amber-700 border border-amber-300 rounded-full px-4"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Create Profile
              </Button>
            </div>
          </div>
        )}
        
        {!profileExists && !isOwnProfile && (
          <div className="mb-6 rounded-2xl bg-sky-50 border border-sky-200 p-5">
            <p className="text-sky-700">
              This user hasn't created a profile yet. You can still follow them.
            </p>
          </div>
        )}

        {/* Profile Header with Cover Photo Background */}
        <div className="mb-6 rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
          {/* Cover Photo as Full Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-sky-100 to-indigo-100">
            {profileData.coverPhoto && (
              <img 
                src={profileData.coverPhoto} 
                alt="Cover" 
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-white/30"></div>
          </div>
          
          {/* Profile Content - Overlaid on cover */}
          <div className="relative p-6 pt-8">
            {/* User Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Avatar Section */}
              <div className="flex justify-center md:justify-start">
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-slate-50">
                  {profileData.profilePicture ? (
                    <img 
                      src={profileData.profilePicture} 
                      alt={displayName} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <User className="h-14 w-14 text-slate-400" />
                    </div>
                  )}
                </div>
              </div>
              
              {/* User Details */}
              <div className="md:col-span-3 bg-white/60 backdrop-blur-sm rounded-xl p-5 shadow-lg">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex">
                    <span className="text-slate-500 w-32 text-sm">Nickname</span>
                    <span className="text-slate-900 font-medium">{displayName}</span>
                  </div>
                  <div className="flex">
                    <span className="text-slate-500 w-32 text-sm">Address</span>
                    <span className="text-slate-700 font-mono text-sm">{fullAddress}</span>
                  </div>
                  <div className="flex">
                    <span className="text-slate-500 w-32 text-sm">Status</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">Active</span>
                  </div>
                  <div className="flex">
                    <span className="text-slate-500 w-32 text-sm">Member since</span>
                    <span className="text-slate-700">{profileData.memberSince}</span>
                  </div>
                  <div className="flex">
                    <span className="text-slate-500 w-32 text-sm">Posts</span>
                    <span className="text-slate-900 font-medium">{profileData.postCount}</span>
                  </div>
                  <div className="mt-2 border-t border-slate-200 pt-3">
                    <span className="text-slate-500 text-sm">Bio</span>
                    <p className="text-slate-700 mt-1">{profileData.bio}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex justify-between mt-6 pt-4 border-t border-white/20">
            <Button 
              onClick={() => router.push('/foro')}
              className="bg-white/90 backdrop-blur-sm border border-white/50 text-slate-700 hover:bg-white rounded-full px-4 text-sm shadow-lg"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Forum
            </Button>
            
            <div className="flex flex-wrap gap-2">
              {isOwnProfile ? (
                <Button 
                  onClick={() => router.push('/profile/edit')}
                  className="bg-slate-900 text-white hover:bg-slate-800 rounded-full px-4 text-sm shadow-lg"
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
                    ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' 
                    : 'bg-slate-900 text-white hover:bg-slate-800'} disabled:opacity-50 disabled:cursor-not-allowed`}
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
                  Moderación
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
        
        {/* Stats Section - Outside card */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Statistics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200 p-5 shadow-sm">
              <p className="text-xs text-slate-500 mb-1">Likes Received</p>
              <p className="text-2xl font-semibold text-slate-900">{profileData.likesReceived}</p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200 p-5 shadow-sm">
              <p className="text-xs text-slate-500 mb-1">Likes Given</p>
              <p className="text-2xl font-semibold text-slate-900">{profileData.likesGiven}</p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200 p-5 shadow-sm">
              <p className="text-xs text-slate-500 mb-1">Followers</p>
              <p className="text-2xl font-semibold text-slate-900">{profileData.followers}</p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200 p-5 shadow-sm">
              <p className="text-xs text-slate-500 mb-1">Following</p>
              <p className="text-2xl font-semibold text-slate-900">{profileData.following}</p>
            </div>
          </div>
        </div>

        {/* Communities Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Communities</h2>
          </div>
          
          <div className="p-4">
            {userCommunities.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {userCommunities.map((community) => (
                  <div 
                    key={community.id} 
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
                      {community.photo ? (
                        <img 
                          src={`https://gateway.pinata.cloud/ipfs/${community.photo}`}
                          alt={community.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Try alternative gateway
                            const img = e.target as HTMLImageElement;
                            if (!img.dataset.retried) {
                              img.dataset.retried = 'true';
                              img.src = `https://ipfs.io/ipfs/${community.photo}`;
                            } else {
                              // Hide image and show fallback initial
                              img.style.display = 'none';
                              const parent = img.parentElement;
                              if (parent && !parent.querySelector('.fallback-initial')) {
                                const fallback = document.createElement('div');
                                fallback.className = 'fallback-initial w-full h-full flex items-center justify-center text-slate-400 text-sm font-medium';
                                fallback.textContent = community.name.charAt(0).toUpperCase();
                                parent.appendChild(fallback);
                              }
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-medium">
                          {community.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{community.name}</p>
                      <p className="text-xs text-slate-500">{community.memberCount} members</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <User className="h-10 w-10 text-slate-300 mb-3" />
                <p className="text-slate-500 text-sm">Not a member of any community yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
          </div>
          
          <div className="min-h-[200px]">
            {recentActivity.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className="mt-1 p-2 bg-slate-100 rounded-full">
                        {activity.type === 'post' && <MessageSquare className="h-4 w-4 text-indigo-600" />}
                        {activity.type === 'comment' && <MessageSquare className="h-4 w-4 text-emerald-600" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            activity.type === 'post' 
                              ? 'bg-indigo-100 text-indigo-700' 
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {activity.type === 'post' ? 'Post' : 'Comment'}
                          </span>
                          <span className="text-slate-500 text-xs">in</span>
                          <span className="text-slate-700 text-xs font-medium">{activity.communityName}</span>
                          {activity.topic && (
                            <>
                              <span className="text-slate-400 text-xs">•</span>
                              <span className="text-slate-500 text-xs">{activity.topic}</span>
                            </>
                          )}
                        </div>
                        <p className="text-slate-700 text-sm mt-1">
                          {activity.content}
                        </p>
                        <p className="text-slate-400 text-xs mt-2">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-slate-300 mb-4" />
                <p className="text-slate-500">No activity to display yet.</p>
                <p className="text-slate-400 text-sm mt-2">Start posting to see your activity here!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
