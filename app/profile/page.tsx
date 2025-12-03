"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWalletContext } from "@/contexts/WalletContext";
import { useProfileService } from "@/lib/profileService";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { User, ArrowLeft, Edit3, MessageSquare, Heart, UserPlus, UserCheck } from "lucide-react";
import { MatrixRain } from "@/components/MatrixRain";
import { BrowserProvider, Contract } from "ethers";
import { forumAddress, forumABI } from "@/contracts/DecentralizedForum_Commuties_arbitrum";

// ABI for ForumProfileManager (only the functions we need for follow)
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

// Interface for recent activity
interface RecentActivity {
  type: 'post' | 'comment' | 'like';
  title: string;
  communityName?: string;
  timestamp: number;
  postId?: number;
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
  const profileService = useProfileService();
  
  // Get target address from URL param or use current user's address
  const targetAddress = searchParams.get('address') || currentUserAddress;
  const isOwnProfile = !searchParams.get('address') || 
    (currentUserAddress && searchParams.get('address')?.toLowerCase() === currentUserAddress.toLowerCase());
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("activity");
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

  // Check follow status for other users
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!currentUserAddress || !targetAddress || isOwnProfile) return;
      
      try {
        const ethereum = (window as any).ethereum;
        if (!ethereum) return;
        
        const provider = new BrowserProvider(ethereum);
        const mainContract = new Contract(forumAddress, forumABI, provider);
        const profileManagerAddress = await mainContract.profileManager();
        const profileManager = new Contract(profileManagerAddress, profileManagerABI, provider);
        
        const following = await profileManager.isFollowing(currentUserAddress, targetAddress);
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
    
    setFollowLoading(true);
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) return;
      
      const provider = new BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      
      const mainContract = new Contract(forumAddress, forumABI, provider);
      const profileManagerAddress = await mainContract.profileManager();
      const profileManager = new Contract(profileManagerAddress, profileManagerABI, signer);
      
      if (isFollowing) {
        const tx = await profileManager.unfollowUser(targetAddress);
        await tx.wait();
        setIsFollowing(false);
        setProfileData(prev => ({ ...prev, followers: Math.max(0, prev.followers - 1) }));
      } else {
        const tx = await profileManager.followUser(targetAddress);
        await tx.wait();
        setIsFollowing(true);
        setProfileData(prev => ({ ...prev, followers: prev.followers + 1 }));
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
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
            postCount: 0,
            memberSince: profile.createdAt 
              ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) 
              : "Recently joined"
          });
        }

        // Load user's posts from blockchain for activity
        const ethereum = (window as any).ethereum;
        if (ethereum) {
          try {
            const browserProvider = new BrowserProvider(ethereum);
            const contract = new Contract(forumAddress, forumABI, browserProvider);
            
            const allPosts = await contract.getActivePosts();
            const myPosts = allPosts.filter((post: any) => 
              post.author.toLowerCase() === targetAddress.toLowerCase()
            );
            
            setProfileData(prev => ({
              ...prev,
              postCount: myPosts.length
            }));
            
            // Create recent activity from posts
            const activities: RecentActivity[] = myPosts.slice(0, 5).map((post: any) => ({
              type: 'post' as const,
              title: '', // we no longer show the post title in the activity list
              // Prefer a community name field if available, otherwise fallback to a generic label
              communityName: (post.communityName || post.community || 'Community') as string,
              timestamp: Number(post.timestamp) * 1000,
              postId: Number(post.id)
            }));
            setRecentActivity(activities);
          } catch (e) {
            console.log("Could not load posts:", e);
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
      <div className="container mx-auto p-4 flex items-center justify-center min-h-screen bg-black text-[var(--matrix-green)]">
        <div className="flex flex-col items-center">
          <p className="text-lg font-mono">$ loading profile_data.dat</p>
          <div className="mt-4 flex space-x-1">
            <div className="h-2 w-2 bg-[var(--matrix-green)] animate-pulse delay-0"></div>
            <div className="h-2 w-2 bg-[var(--matrix-green)] animate-pulse delay-150"></div>
            <div className="h-2 w-2 bg-[var(--matrix-green)] animate-pulse delay-300"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 bg-black min-h-screen font-mono">
      {/* Matrix-style background animation */}
      <MatrixRain />
      
      <div className="relative z-10">
        {/* Cover Photo */}
        {profileData.coverPhoto && (
          <div className="mb-4 border border-[var(--matrix-green)] overflow-hidden">
            <div className="w-full h-48 relative">
              <img 
                src={profileData.coverPhoto} 
                alt="Cover" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
            </div>
          </div>
        )}

        {/* Banner if no profile exists */}
        {!profileExists && isOwnProfile && (
          <div className="mb-4 border border-yellow-500/50 bg-yellow-500/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-500 font-bold">⚠️ Profile not found on blockchain</p>
                <p className="text-yellow-500/70 text-sm mt-1">
                  Create your on-chain profile to personalize your NodeSpeak experience.
                </p>
              </div>
              <Button 
                onClick={() => router.push('/profile/edit')}
                className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 border border-yellow-500"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Create Profile
              </Button>
            </div>
          </div>
        )}
        
        {!profileExists && !isOwnProfile && (
          <div className="mb-4 border border-[var(--matrix-green)]/50 bg-[var(--matrix-green)]/10 p-4">
            <p className="text-[var(--matrix-green)]">
              This user hasn't created a profile yet. You can still follow them.
            </p>
          </div>
        )}

        {/* Terminal-style header */}
        <div className="mb-6 border border-[var(--matrix-green)] p-4">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[var(--matrix-green)]">root@nodespeak:~# </span>
            <span className="text-[var(--matrix-green)]">cat user_profile.dat</span>
            <span className="cursor h-4 w-2 bg-[var(--matrix-green)]"></span>
          </div>
          
          <div className="border-t border-[var(--matrix-green)]/30 my-2"></div>
          
          {/* User Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Avatar Section */}
            <div className="border border-[var(--matrix-green)]/50 overflow-hidden flex items-center justify-center">
              {profileData.profilePicture ? (
                <img 
                  src={profileData.profilePicture} 
                  alt={displayName} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-24 w-24 flex items-center justify-center bg-[var(--matrix-green)]/10">
                  <User className="h-12 w-12 text-[var(--matrix-green)]" />
                </div>
              )}
            </div>
            
            {/* User Details */}
            <div className="md:col-span-3 border border-[var(--matrix-green)]/50 p-4">
              <div className="grid grid-cols-1 gap-2">
                <div className="flex">
                  <span className="text-[var(--matrix-green)]/70 w-32">NICKNAME:</span>
                  <span className="text-[var(--matrix-green)]">{displayName}</span>
                </div>
                <div className="flex">
                  <span className="text-[var(--matrix-green)]/70 w-32">ADDRESS:</span>
                  <span className="text-[var(--matrix-green)]">{fullAddress}</span>
                </div>
                <div className="flex">
                  <span className="text-[var(--matrix-green)]/70 w-32">STATUS:</span>
                  <span className="text-[var(--matrix-green)]">ACTIVE</span>
                </div>
                <div className="flex">
                  <span className="text-[var(--matrix-green)]/70 w-32">MEMBER_SINCE:</span>
                  <span className="text-[var(--matrix-green)]">{profileData.memberSince}</span>
                </div>
                <div className="flex">
                  <span className="text-[var(--matrix-green)]/70 w-32">POSTS:</span>
                  <span className="text-[var(--matrix-green)]">{profileData.postCount}</span>
                </div>
                <div className="mt-2 border-t border-[var(--matrix-green)]/30 pt-2">
                  <span className="text-[var(--matrix-green)]/70">BIO:</span>
                  <p className="text-[var(--matrix-green)] mt-1">{profileData.bio}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-between mt-4 pt-4 border-t border-[var(--matrix-green)]/30">
            <Button 
              onClick={() => router.push('/foro')}
              className="bg-[#001800] hover:bg-[#002800] text-[var(--matrix-green)] text-xs py-1 px-2 h-auto flex items-center space-x-1 border border-[var(--matrix-green)]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Forum</span>
            </Button>
            
            {isOwnProfile ? (
              <Button 
                onClick={() => router.push('/profile/edit')}
                className="bg-[#001800] hover:bg-[#002800] text-[var(--matrix-green)] text-xs py-1 px-2 h-auto flex items-center space-x-1 border border-[var(--matrix-green)]"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit Profile</span>
              </Button>
            ) : currentUserAddress ? (
              <Button 
                onClick={handleFollow}
                disabled={followLoading}
                className="bg-[#001800] hover:bg-[#002800] text-[var(--matrix-green)] text-xs py-1 px-2 h-auto flex items-center space-x-1 border border-[var(--matrix-green)] disabled:opacity-50"
              >
                {followLoading ? (
                  <span className="animate-pulse">...</span>
                ) : isFollowing ? (
                  <>
                    <UserCheck className="h-4 w-4" />
                    <span>Unfollow</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>Follow</span>
                  </>
                )}
              </Button>
            ) : null}
          </div>
        </div>
        
        {/* Terminal-style tabs */}
        <div className="border border-[var(--matrix-green)]">
          <div className="flex border-b border-[var(--matrix-green)]">
            <button 
              onClick={() => setActiveTab("activity")}
              className={`flex-1 py-2 px-4 text-center ${activeTab === "activity" ? "bg-[var(--matrix-green)]/10 text-[var(--matrix-green)]" : "text-[var(--matrix-green)]/70"}`}
            >
              Activity
            </button>
            <button 
              onClick={() => setActiveTab("stats")}
              className={`flex-1 py-2 px-4 text-center ${activeTab === "stats" ? "bg-[var(--matrix-green)]/10 text-[var(--matrix-green)]" : "text-[var(--matrix-green)]/70"}`}
            >
              Stats
            </button>
          </div>
          
          {/* Tab content */}
          <div>
            {activeTab === "activity" && (
              <div className="min-h-[200px]">
                {recentActivity.length > 0 ? (
                  <div className="divide-y divide-[var(--matrix-green)]/30">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="p-4 hover:bg-[var(--matrix-green)]/5 transition-colors">
                        <div className="flex items-start space-x-3">
                          <div className="mt-1">
                            {activity.type === 'post' && <MessageSquare className="h-4 w-4 text-[var(--matrix-green)]" />}
                            {activity.type === 'like' && <Heart className="h-4 w-4 text-[var(--matrix-green)]" />}
                          </div>
                          <div className="flex-1">
                            {activity.communityName && (
                              <p className="text-[var(--matrix-green)] text-sm">
                                in {activity.communityName}
                              </p>
                            )}
                            <p className="text-[var(--matrix-green)]/40 text-xs mt-1">
                              {new Date(activity.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <MessageSquare className="h-12 w-12 text-[var(--matrix-green)]/30 mb-4" />
                    <p className="text-[var(--matrix-green)]/70">No activity to display yet.</p>
                    <p className="text-[var(--matrix-green)]/50 text-sm mt-2">Start posting to see your activity here!</p>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === "stats" && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-0">
                <div className="border border-[var(--matrix-green)] p-4">
                  <p className="text-xs text-[var(--matrix-green)]/70">Likes Received</p>
                  <p className="text-2xl text-[var(--matrix-green)]">{profileData.likesReceived}</p>
                </div>
                <div className="border border-[var(--matrix-green)] p-4">
                  <p className="text-xs text-[var(--matrix-green)]/70">Likes Given</p>
                  <p className="text-2xl text-[var(--matrix-green)]">{profileData.likesGiven}</p>
                </div>
                <div className="border border-[var(--matrix-green)] p-4">
                  <p className="text-xs text-[var(--matrix-green)]/70">Followers</p>
                  <p className="text-2xl text-[var(--matrix-green)]">{profileData.followers}</p>
                </div>
                <div className="border border-[var(--matrix-green)] p-4">
                  <p className="text-xs text-[var(--matrix-green)]/70">Following</p>
                  <p className="text-2xl text-[var(--matrix-green)]">{profileData.following}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Custom styles for matrix effects */}
      <style jsx global>{`
        :root {
          --matrix-green: #00ff00;
        }
        
        .cursor {
          animation: blink 1s step-end infinite;
        }
        
        @keyframes blink {
          50% { opacity: 0; }
        }
        
        /* Add a subtle text effect */
        .text-[var(--matrix-green)] {
          text-shadow: 0 0 5px var(--matrix-green);
        }
      `}</style>
    </div>
  );
}
