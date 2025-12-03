"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWalletContext } from "@/contexts/WalletContext";
import { useProfileService } from "@/lib/profileService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, User, Save, Upload, ImagePlus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { MatrixRain } from "@/components/MatrixRain";

export default function EditProfilePage() {
  const router = useRouter();
  const { address, ensName, isConnected } = useWalletContext();
  const profileService = useProfileService();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [coverPhoto, setCoverPhoto] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>("");
  const [coverPhotoPreview, setCoverPhotoPreview] = useState<string>("");
  const [stats, setStats] = useState({
    likesReceived: 0,
    likesGiven: 0,
    followers: 0,
    following: 0
  });

  useEffect(() => {
    // Redirect if not connected
    if (!isConnected) {
      router.push('/');
      return;
    }

    // Load profile data from localStorage
    const loadProfileData = async () => {
      if (!address) {
        setIsLoading(false);
        return;
      }

      try {
        console.log("Loading profile for address:", address);
        
        // Check if profile exists
        const hasProfile = await profileService.checkProfileExists(address);
        setProfileExists(hasProfile);
        console.log("Profile exists:", hasProfile);

        if (hasProfile) {
          // Get profile data
          const profileData = await profileService.getProfile(address);
          if (profileData) {
            console.log("Profile data loaded:", profileData);
            setNickname(ensName || profileData.nickname || "");
            setBio(profileData.bio || "Web3 enthusiast and NodeSpeak community member");
            
            // Set profile picture preview if available
            if (profileData.profilePicture) {
              setProfilePicturePreview(profileData.profilePicture);
            }
            
            // Set cover photo preview if available
            if (profileData.coverPhoto) {
              setCoverPhotoPreview(profileData.coverPhoto);
            }
            
            // Set stats
            setStats({
              likesReceived: profileData.likesReceived || 0,
              likesGiven: profileData.likesGiven || 0,
              followers: profileData.followers || 0,
              following: profileData.following || 0
            });
          }
        } else {
          // New user, set default values
          console.log("New user, setting defaults");
          setNickname(ensName || "");
          setBio("Web3 enthusiast and NodeSpeak community member");
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        toast({
          title: "Error loading profile",
          description: "There was an error loading your profile data. Please try again later.",
          variant: "destructive"
        });
      } finally {
        console.log("Setting isLoading to false");
        setIsLoading(false);
      }
    };

    loadProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, ensName, isConnected, router]);

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Profile picture must be under 2MB",
          variant: "destructive"
        });
        return;
      }
      
      setProfilePicture(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setProfilePicturePreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Cover photo must be under 5MB",
          variant: "destructive"
        });
        return;
      }
      
      setCoverPhoto(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setCoverPhotoPreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Callback to handle transaction status updates
  const handleStatusChange = (status: 'uploading' | 'signing' | 'pending' | 'confirmed' | 'failed', message?: string) => {
    switch (status) {
      case 'uploading':
        toast({
          title: "📤 Uploading to IPFS...",
          description: message || "Please wait while we upload your files to IPFS.",
        });
        break;
      case 'signing':
        toast({
          title: "✍️ Awaiting signature",
          description: message || "Please sign the transaction in MetaMask to save your profile on-chain.",
        });
        break;
      case 'pending':
        toast({
          title: "⏳ Transaction pending",
          description: message || "Your transaction is being processed on Arbitrum...",
        });
        break;
      case 'confirmed':
        toast({
          title: "✅ Transaction confirmed!",
          description: message || "Your profile has been saved on the blockchain!",
        });
        break;
      case 'failed':
        toast({
          title: "❌ Transaction failed",
          description: message || "There was an error processing your transaction.",
          variant: "destructive"
        });
        break;
    }
  };

  const handleSave = async () => {
    console.log("=== STARTING PROFILE SAVE ===");
    console.log("Nickname:", nickname);
    console.log("Has profile picture:", !!profilePicture);
    console.log("Has cover photo:", !!coverPhoto);
    console.log("Bio:", bio);
    console.log("Profile exists:", profileExists);
    
    setIsSaving(true);
    
    try {
      let success;
      
      // Check if we're creating or updating profile
      if (profileExists) {
        // Update existing profile
        console.log("Updating existing profile...");
        
        success = await profileService.updateProfile(
          nickname,
          profilePicture,
          coverPhoto,
          bio,
          handleStatusChange
        );
        
        console.log("Update result:", success);
      } else {
        // Create new profile
        console.log("Creating new profile...");
        
        success = await profileService.createProfile(
          nickname,
          profilePicture,
          coverPhoto,
          bio,
          handleStatusChange
        );
        
        console.log("Create result:", success);
      }
      
      if (success) {
        console.log("Profile saved successfully, redirecting...");
        // Navigate back to profile page
        setTimeout(() => router.push('/profile'), 2000);
      }
    } catch (error) {
      console.error("=== ERROR SAVING PROFILE ===");
      console.error("Error details:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      toast({
        title: "Error saving profile",
        description: error instanceof Error ? error.message : "There was an error saving your profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      console.log("=== PROFILE SAVE COMPLETED ===");
      setIsSaving(false);
    }
  };

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

  // Helper function to shorten Ethereum addresses
  const shortenAddress = (addr: string, chars = 4): string => {
    if (!addr) return '';
    return `${addr.substring(0, chars + 2)}...${addr.substring(addr.length - chars)}`;
  };

  const displayName = ensName || nickname || (address ? shortenAddress(address) : "");

  return (
    <div className="container mx-auto p-4 bg-black min-h-screen font-mono">
      {/* Matrix-style background animation with very low intensity */}
      <MatrixRain intensity="low" className="absolute inset-0 opacity-10" />
      
      <div className="relative z-10">
        {/* Terminal-style header */}
        <div className="mb-6 border border-[var(--matrix-green)] p-4">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[var(--matrix-green)]">root@nodespeak:~# </span>
            <span className="text-[var(--matrix-green)]">cat user_profile.dat</span>
            <span className="cursor h-4 w-2 bg-[var(--matrix-green)]"></span>
          </div>
          
          <div className="border-t border-[var(--matrix-green)]/30 my-2"></div>
          
          {/* User profile layout similar to the image */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Cover Photo Section */}
            <div className="md:col-span-4 border border-[var(--matrix-green)] p-3 mb-2">
              <div className="flex justify-between items-center mb-2">
                <div className="text-[var(--matrix-green)] text-sm">COVER_IMAGE:</div>
                <Label
                  htmlFor="coverPhoto"
                  className="cursor-pointer text-[var(--matrix-green)] text-xs py-1 px-2 border border-[var(--matrix-green)]/50 hover:bg-[var(--matrix-green)]/10"
                >
                  UPLOAD_COVER
                </Label>
                <Input
                  id="coverPhoto"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverPhotoChange}
                  className="hidden"
                />
              </div>
              <div className="w-full h-32 border border-[var(--matrix-green)]/50 flex items-center justify-center overflow-hidden">
                {coverPhotoPreview ? (
                  <img 
                    src={coverPhotoPreview} 
                    alt="Cover" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center text-[var(--matrix-green)]/50">
                    <ImagePlus className="w-8 h-8 mb-1" />
                    <span className="text-xs">[NO_COVER_IMAGE]</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* User Avatar Section */}
            <div className="border border-[var(--matrix-green)] p-4">
              <div className="flex flex-col items-center">
                <div className="w-full aspect-square border border-[var(--matrix-green)] flex items-center justify-center mb-4 overflow-hidden">
                  {profilePicturePreview ? (
                    <img 
                      src={profilePicturePreview} 
                      alt={displayName} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-16 h-16 text-[var(--matrix-green)]" />
                  )}
                </div>
                
                <div className="text-center text-[var(--matrix-green)] text-sm mb-2">
                  {displayName}
                </div>
                
                <div className="text-xs text-[var(--matrix-green)]/70 text-center break-all">
                  {address}
                </div>
              </div>
              
              <div className="mt-4 flex justify-center">
                <Label
                  htmlFor="profilePicture"
                  className="cursor-pointer text-center text-[var(--matrix-green)] text-xs py-1 px-2 border border-[var(--matrix-green)]/50 hover:bg-[var(--matrix-green)]/10"
                >
                  UPLOAD_AVATAR
                </Label>
                <Input
                  id="profilePicture"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                />
              </div>
            </div>
            
            {/* User details section */}
            <div className="md:col-span-3 border border-[var(--matrix-green)] p-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[var(--matrix-green)] mb-1">NICKNAME:</div>
                    <Input
                      type="text"
                      id="nickname"
                      placeholder="Enter your nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      disabled={isSaving}
                      className="border-[var(--matrix-green)]/50 bg-black text-[var(--matrix-green)] focus:border-[var(--matrix-green)] focus:ring-[var(--matrix-green)]/20 rounded-none h-8"
                    />
                  </div>
                  
                  <div>
                    <div className="text-[var(--matrix-green)] mb-1">ADDRESS:</div>
                    <div className="text-[var(--matrix-green)] text-sm truncate">{shortenAddress(address || '', 12)}</div>
                  </div>
                </div>
                
                <div>
                  <div className="text-[var(--matrix-green)] mb-1">STATUS:</div>
                  <div className="text-[var(--matrix-green)]">ACTIVE</div>
                </div>
                
                <div>
                  <div className="text-[var(--matrix-green)] mb-1">MEMBER_SINCE:</div>
                  <div className="text-[var(--matrix-green)]">March 2023</div>
                </div>
                
                <div>
                  <div className="text-[var(--matrix-green)] mb-1">POSTS:</div>
                  <div className="text-[var(--matrix-green)]">0</div>
                </div>
                
                <div className="border-t border-[var(--matrix-green)]/30 my-2 pt-2">
                  <div className="text-[var(--matrix-green)] mb-1">BIO:</div>
                  <Textarea
                    id="bio"
                    placeholder="Tell the community about yourself"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="border-[var(--matrix-green)]/50 bg-black text-[var(--matrix-green)] focus:border-[var(--matrix-green)] focus:ring-[var(--matrix-green)]/20 rounded-none resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Submit button */}
          <div className="mt-4 flex justify-between">
            <Button 
              onClick={() => router.push('/profile')}
              className="bg-[#001800] hover:bg-[#002800] text-[var(--matrix-green)] text-xs py-1 px-2 h-auto flex items-center space-x-1 border border-[var(--matrix-green)]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Profile</span>
            </Button>
            
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#001800] hover:bg-[#002800] text-[var(--matrix-green)] text-xs py-1 px-2 h-auto flex items-center space-x-1 border border-[var(--matrix-green)]"
            >
              <Save className="h-4 w-4" />
              <span>Edit Profile</span>
            </Button>
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
