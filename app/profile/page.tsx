"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWalletContext } from "@/contexts/WalletContext";
import { ProfileHeader } from "@/components/ProfileHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

// Function to simulate loading profile data from blockchain
// In a real app, this would fetch data from the smart contract
const loadProfileData = async (address: string) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock data - in production, this would come from the blockchain
  return {
    nickname: "",
    bio: "Web3 enthusiast and NodeSpeak community member",
    profilePicture: "",
    coverPhoto: "",
    likesReceived: 0,
    likesGiven: 0,
    followers: 0,
    following: 0,
    postCount: 0,
    memberSince: "March 2023"
  };
};

export default function ProfilePage() {
  const router = useRouter();
  const { address, ensName, isConnected } = useWalletContext();
  
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    // Redirect if not connected
    if (!isConnected) {
      router.push('/');
      return;
    }

    // Load profile data
    if (address) {
      loadProfileData(address).then(data => {
        setProfileData(data);
        setIsLoading(false);
      });
    }
  }, [address, isConnected, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-screen bg-black text-[var(--matrix-green)]">
        <p className="text-lg font-mono animate-pulse">Loading profile data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 bg-black min-h-screen">
      {/* Matrix-style background animation */}
      <canvas className="matrix-rain absolute inset-0" />
      
      <div className="relative z-10">
        <ProfileHeader 
          userAddress={address || ""}
          username={ensName || profileData.nickname}
          bio={profileData.bio}
          avatarUrl={profileData.profilePicture}
          memberSince={profileData.memberSince}
          postCount={profileData.postCount}
          isCurrentUser={true}
        />
        
        <Tabs defaultValue="activity" className="mt-6">
          <TabsList className="w-full border-b border-[var(--matrix-green)]/30 bg-transparent">
            <TabsTrigger 
              value="activity" 
              className="flex-1 text-[var(--matrix-green)]/70 data-[state=active]:text-[var(--matrix-green)] data-[state=active]:border-b-2 data-[state=active]:border-[var(--matrix-green)]"
            >
              Activity
            </TabsTrigger>
            <TabsTrigger 
              value="stats" 
              className="flex-1 text-[var(--matrix-green)]/70 data-[state=active]:text-[var(--matrix-green)] data-[state=active]:border-b-2 data-[state=active]:border-[var(--matrix-green)]"
            >
              Stats
            </TabsTrigger>
            <TabsTrigger 
              value="followers" 
              className="flex-1 text-[var(--matrix-green)]/70 data-[state=active]:text-[var(--matrix-green)] data-[state=active]:border-b-2 data-[state=active]:border-[var(--matrix-green)]"
            >
              Network
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="activity" className="mt-4">
            <Card className="border border-[var(--matrix-green)]/30 bg-black">
              <CardContent className="p-4">
                <div className="min-h-[200px] flex items-center justify-center">
                  <p className="text-[var(--matrix-green)]/70 font-mono">No activity to display yet.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="stats" className="mt-4">
            <Card className="border border-[var(--matrix-green)]/30 bg-black">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[var(--matrix-green)]/80 font-mono">
                  <div className="border border-[var(--matrix-green)]/20 p-4 rounded">
                    <p className="text-xs text-[var(--matrix-green)]/60">Likes Received</p>
                    <p className="text-2xl mt-2">{profileData.likesReceived}</p>
                  </div>
                  <div className="border border-[var(--matrix-green)]/20 p-4 rounded">
                    <p className="text-xs text-[var(--matrix-green)]/60">Likes Given</p>
                    <p className="text-2xl mt-2">{profileData.likesGiven}</p>
                  </div>
                  <div className="border border-[var(--matrix-green)]/20 p-4 rounded">
                    <p className="text-xs text-[var(--matrix-green)]/60">Followers</p>
                    <p className="text-2xl mt-2">{profileData.followers}</p>
                  </div>
                  <div className="border border-[var(--matrix-green)]/20 p-4 rounded">
                    <p className="text-xs text-[var(--matrix-green)]/60">Following</p>
                    <p className="text-2xl mt-2">{profileData.following}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="followers" className="mt-4">
            <Card className="border border-[var(--matrix-green)]/30 bg-black">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="border-b border-[var(--matrix-green)]/20 pb-4">
                    <h3 className="text-lg font-mono text-[var(--matrix-green)] mb-4">Followers ({profileData.followers})</h3>
                    {profileData.followers > 0 ? (
                      <div>Follower list would appear here</div>
                    ) : (
                      <p className="text-[var(--matrix-green)]/70 font-mono">No followers yet.</p>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-mono text-[var(--matrix-green)] mb-4">Following ({profileData.following})</h3>
                    {profileData.following > 0 ? (
                      <div>Following list would appear here</div>
                    ) : (
                      <p className="text-[var(--matrix-green)]/70 font-mono">Not following anyone yet.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
