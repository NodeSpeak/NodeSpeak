"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWalletContext } from "@/contexts/WalletContext";
import { useProfileService } from "@/lib/profileService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, ImagePlus, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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

    // Load profile data from blockchain
    const loadProfileData = async () => {
      if (!address) return;

      try {
        // Check if profile exists
        const hasProfile = await profileService.checkProfileExists(address);
        setProfileExists(hasProfile);

        if (hasProfile) {
          // Get profile data
          const profileData = await profileService.getProfile(address);
          if (profileData) {
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
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [address, ensName, isConnected, router, profileService]);

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

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      let success;
      
      // Check if we're creating or updating profile
      if (profileExists) {
        // Update existing profile
        success = await profileService.updateProfile(
          nickname,
          profilePicture,
          coverPhoto,
          bio
        );
        
        if (success) {
          toast({
            title: "Profile updated",
            description: "Your profile has been successfully updated on the blockchain."
          });
        }
      } else {
        // Create new profile
        success = await profileService.createProfile(
          nickname,
          profilePicture,
          coverPhoto,
          bio
        );
        
        if (success) {
          toast({
            title: "Profile created",
            description: "Your profile has been successfully created on the blockchain."
          });
        }
      }
      
      if (success) {
        // Navigate back to profile page
        router.push('/profile');
      } else {
        toast({
          title: "Transaction failed",
          description: "There was an error with the blockchain transaction. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error saving profile",
        description: "There was an error saving your profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-screen bg-black text-[var(--matrix-green)]">
        <p className="text-lg font-mono animate-pulse">Loading profile data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 bg-black min-h-screen">
      {/* Matrix-style background animation would be here */}
      <canvas className="matrix-rain absolute inset-0" />
      
      <div className="relative z-10">
        <h1 className="text-2xl font-mono text-[var(--matrix-green)] mb-6">
          {profileExists ? "Edit Profile" : "Create Profile"}
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Profile Details */}
          <div className="space-y-6">
            <Card className="border border-[var(--matrix-green)]/30 bg-black">
              <CardHeader>
                <CardTitle className="text-xl font-mono text-[var(--matrix-green)]">Profile Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nickname" className="text-[var(--matrix-green)]">Nickname or ENS</Label>
                  <Input
                    id="nickname"
                    placeholder={address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : ""}
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="border-[var(--matrix-green)]/50 bg-black text-[var(--matrix-green)] focus:border-[var(--matrix-green)] focus:ring-[var(--matrix-green)]/20"
                  />
                  <p className="text-xs text-[var(--matrix-green)]/70">
                    {ensName ? `You have ENS: ${ensName}` : "No ENS detected for your address"}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-[var(--matrix-green)]">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell the community about yourself"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="border-[var(--matrix-green)]/50 bg-black text-[var(--matrix-green)] focus:border-[var(--matrix-green)] focus:ring-[var(--matrix-green)]/20"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
            
            {profileExists && (
              <Card className="border border-[var(--matrix-green)]/30 bg-black">
                <CardHeader>
                  <CardTitle className="text-xl font-mono text-[var(--matrix-green)]">Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-[var(--matrix-green)]/80 font-mono">
                    <div className="space-y-1">
                      <p className="text-xs">Likes Received</p>
                      <p className="text-2xl">{stats.likesReceived}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs">Likes Given</p>
                      <p className="text-2xl">{stats.likesGiven}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs">Followers</p>
                      <p className="text-2xl">{stats.followers}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs">Following</p>
                      <p className="text-2xl">{stats.following}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Right Column: Profile Pictures */}
          <div className="space-y-6">
            <Card className="border border-[var(--matrix-green)]/30 bg-black">
              <CardHeader>
                <CardTitle className="text-xl font-mono text-[var(--matrix-green)]">Profile Picture</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <div className="w-40 h-40 rounded-full border-2 border-dashed border-[var(--matrix-green)]/50 flex items-center justify-center overflow-hidden relative">
                    {profilePicturePreview ? (
                      <img 
                        src={profilePicturePreview} 
                        alt="Profile Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImagePlus className="w-10 h-10 text-[var(--matrix-green)]/50" />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <Label
                    htmlFor="profilePicture"
                    className="cursor-pointer flex items-center space-x-2 text-[var(--matrix-green)] py-2 px-4 border border-[var(--matrix-green)]/50 rounded-md hover:bg-[var(--matrix-green)]/10"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Profile Picture</span>
                  </Label>
                  <Input
                    id="profilePicture"
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-center text-[var(--matrix-green)]/70">
                  Recommended: Square image, max 2MB
                </p>
              </CardContent>
            </Card>
            
            <Card className="border border-[var(--matrix-green)]/30 bg-black">
              <CardHeader>
                <CardTitle className="text-xl font-mono text-[var(--matrix-green)]">Cover Photo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <div className="w-full h-40 border-2 border-dashed border-[var(--matrix-green)]/50 flex items-center justify-center overflow-hidden relative">
                    {coverPhotoPreview ? (
                      <img 
                        src={coverPhotoPreview} 
                        alt="Cover Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImagePlus className="w-10 h-10 text-[var(--matrix-green)]/50" />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <Label
                    htmlFor="coverPhoto"
                    className="cursor-pointer flex items-center space-x-2 text-[var(--matrix-green)] py-2 px-4 border border-[var(--matrix-green)]/50 rounded-md hover:bg-[var(--matrix-green)]/10"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Cover Photo</span>
                  </Label>
                  <Input
                    id="coverPhoto"
                    type="file"
                    accept="image/*"
                    onChange={handleCoverPhotoChange}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-center text-[var(--matrix-green)]/70">
                  Recommended: 1200x400px, max 5MB
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="mt-8 flex justify-between">
          <Button 
            variant="outline"
            className="border-red-500 text-red-500 hover:bg-red-900/20"
            onClick={() => router.push('/profile')}
          >
            Cancel
          </Button>
          
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="border-[var(--matrix-green)] bg-[var(--matrix-green)]/20 text-[var(--matrix-green)] hover:bg-[var(--matrix-green)]/30 flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>
              {isSaving 
                ? "Processing Transaction..." 
                : profileExists 
                  ? "Save Changes" 
                  : "Create Profile"
              }
            </span>
          </Button>
        </div>
        
        {isSaving && (
          <div className="mt-4 p-4 border border-[var(--matrix-green)]/30 rounded bg-black">
            <p className="text-center text-[var(--matrix-green)] animate-pulse">
              {profileExists 
                ? "Updating your profile on the blockchain..." 
                : "Creating your profile on the blockchain..."
              }
            </p>
            <p className="text-center text-xs text-[var(--matrix-green)]/70 mt-2">
              This process may take a minute or two. Please do not close this window.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
