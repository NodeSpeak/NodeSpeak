"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWalletContext } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { User, ArrowLeft, Edit3 } from "lucide-react";
import { MatrixRain } from "@/components/MatrixRain";

// Function to simulate loading profile data from blockchain
const loadProfileData = async (address: string) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock data - in production, this would come from the blockchain
  return {
    nickname: "",
    bio: "web3 enthusiast and NodeSpeak community member",
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
  const { address, ensName, isConnected } = useWalletContext();
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("activity");
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

  // Get display name
  const displayName = ensName || profileData.nickname || (address ? shortenAddress(address) : "");
  const fullAddress = address || "";

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
            <div className="flex flex-col items-center justify-center border border-[var(--matrix-green)]/50 p-4">
              <div className="h-24 w-24 rounded-none border-2 border-[var(--matrix-green)] flex items-center justify-center mb-2 overflow-hidden">
                {profileData.profilePicture ? (
                  <img 
                    src={profileData.profilePicture} 
                    alt={displayName} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-[var(--matrix-green)]/10">
                    <User className="h-12 w-12 text-[var(--matrix-green)]" />
                  </div>
                )}
              </div>
              <div className="text-center text-[var(--matrix-green)] mt-2 font-bold">
                {displayName}
              </div>
              <div className="text-[var(--matrix-green)]/70 text-xs text-center mt-1">
                {fullAddress}
              </div>
            </div>
            
            {/* User Details */}
            <div className="md:col-span-3 border border-[var(--matrix-green)]/50 p-4">
              <div className="grid grid-cols-1 gap-2">
                <div className="flex">
                  <span className="text-[var(--matrix-green)]/70 w-32">USER_ID:</span>
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
            
            <Button 
              onClick={() => router.push('/profile/edit')}
              className="bg-[#001800] hover:bg-[#002800] text-[var(--matrix-green)] text-xs py-1 px-2 h-auto flex items-center space-x-1 border border-[var(--matrix-green)]"
            >
              <Edit3 className="h-4 w-4" />
              <span>Edit Profile</span>
            </Button>
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
              <div className="min-h-[200px] flex items-center justify-center">
                <p className="text-[var(--matrix-green)]/70">No activity to display yet.</p>
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
