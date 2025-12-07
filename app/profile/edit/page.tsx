"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWalletContext } from "@/contexts/WalletContext";
import { useProfileService } from "@/lib/profileService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, User, Save, Upload, ImagePlus, Pencil } from "lucide-react";
import { CoverImageEditor } from "@/components/CoverImageEditor";
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
  const [showCoverEditor, setShowCoverEditor] = useState(false);
  const [tempCoverImage, setTempCoverImage] = useState<string>("");
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
      
      // Create preview and open editor
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setTempCoverImage(e.target.result as string);
          setShowCoverEditor(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverEditorSave = (croppedBlob: Blob) => {
    // Convert blob to file
    const file = new File([croppedBlob], 'cover.jpg', { type: 'image/jpeg' });
    setCoverPhoto(file);
    
    // Create preview from blob
    const url = URL.createObjectURL(croppedBlob);
    setCoverPhotoPreview(url);
    setShowCoverEditor(false);
    setTempCoverImage("");
    
    toast({
      title: "Cover image adjusted",
      description: "Your cover image has been cropped and saved."
    });
  };

  const handleCoverEditorCancel = () => {
    setShowCoverEditor(false);
    setTempCoverImage("");
  };

  const handleEditExistingCover = () => {
    if (coverPhotoPreview) {
      setTempCoverImage(coverPhotoPreview);
      setShowCoverEditor(true);
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

  // Helper function to shorten Ethereum addresses
  const shortenAddress = (addr: string, chars = 4): string => {
    if (!addr) return '';
    return `${addr.substring(0, chars + 2)}...${addr.substring(addr.length - chars)}`;
  };

  const displayName = ensName || nickname || (address ? shortenAddress(address) : "");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f7ff] via-[#fdfbff] to-[#e6f0ff]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6 bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900 mb-6">Edit Profile</h1>
          
          {/* User profile layout */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {/* Cover Photo Section */}
            <div className="md:col-span-4 bg-slate-50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-slate-700 text-sm font-medium">Cover Image</span>
                <div className="flex items-center gap-2">
                  {coverPhotoPreview && (
                    <button
                      onClick={handleEditExistingCover}
                      className="text-slate-600 text-xs py-1.5 px-3 bg-white hover:bg-slate-100 rounded-full border border-slate-200 transition-colors flex items-center gap-1.5"
                    >
                      <Pencil className="w-3 h-3" />
                      Adjust
                    </button>
                  )}
                  <Label
                    htmlFor="coverPhoto"
                    className="cursor-pointer text-sky-600 text-xs py-1.5 px-3 bg-sky-50 hover:bg-sky-100 rounded-full border border-sky-200 transition-colors"
                  >
                    Upload Cover
                  </Label>
                </div>
                <Input
                  id="coverPhoto"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverPhotoChange}
                  className="hidden"
                />
              </div>
              <div className="w-full h-36 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-white relative group">
                {coverPhotoPreview ? (
                  <>
                    <img 
                      src={coverPhotoPreview} 
                      alt="Cover" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                    {/* Hover overlay for editing */}
                    <div 
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-lg"
                      onClick={handleEditExistingCover}
                    >
                      <div className="text-white text-sm font-medium flex items-center gap-2">
                        <Pencil className="w-4 h-4" />
                        Click to adjust
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-slate-400">
                    <ImagePlus className="w-8 h-8 mb-2" />
                    <span className="text-xs">No cover image</span>
                    <span className="text-xs mt-1">Upload an image to customize</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-2">Recommended: 1200x675px (16:9 ratio). You can adjust the position after uploading.</p>
            </div>
            
            {/* User Avatar Section */}
            <div className="bg-slate-50 rounded-xl p-5">
              <div className="flex flex-col items-center">
                <div className="w-full aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center mb-4 overflow-hidden bg-white">
                  {profilePicturePreview ? (
                    <img 
                      src={profilePicturePreview} 
                      alt={displayName} 
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <User className="w-16 h-16 text-slate-300" />
                  )}
                </div>
                
                <div className="text-center text-slate-900 font-medium text-sm mb-1">
                  {displayName}
                </div>
                
                <div className="text-xs text-slate-500 text-center break-all">
                  {address}
                </div>
              </div>
              
              <div className="mt-4 flex justify-center">
                <Label
                  htmlFor="profilePicture"
                  className="cursor-pointer text-center text-sky-600 text-xs py-1.5 px-3 bg-sky-50 hover:bg-sky-100 rounded-full border border-sky-200 transition-colors"
                >
                  Upload Avatar
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
            <div className="md:col-span-3 bg-slate-50 rounded-xl p-5">
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <Label className="text-slate-700 text-sm font-medium mb-2 block">Nickname</Label>
                    <Input
                      type="text"
                      id="nickname"
                      placeholder="Enter your nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      disabled={isSaving}
                      className="border-slate-200 bg-white text-slate-900 focus:border-sky-400 focus:ring-sky-200 rounded-xl"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-slate-700 text-sm font-medium mb-2 block">Address</Label>
                    <div className="text-slate-600 text-sm font-mono bg-white px-3 py-2 rounded-xl border border-slate-200 truncate">{shortenAddress(address || '', 12)}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <Label className="text-slate-700 text-sm font-medium mb-2 block">Status</Label>
                    <span className="inline-flex px-3 py-1 bg-emerald-100 text-emerald-700 text-sm rounded-full">Active</span>
                  </div>
                  
                  <div>
                    <Label className="text-slate-700 text-sm font-medium mb-2 block">Member Since</Label>
                    <div className="text-slate-600 text-sm">March 2023</div>
                  </div>
                </div>
                
                <div className="border-t border-slate-200 pt-5">
                  <Label className="text-slate-700 text-sm font-medium mb-2 block">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell the community about yourself"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="border-slate-200 bg-white text-slate-900 focus:border-sky-400 focus:ring-sky-200 rounded-xl resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-between pt-4 border-t border-slate-200">
            <Button 
              onClick={() => router.push('/profile')}
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-full px-5 text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Button>
            
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-slate-900 text-white hover:bg-slate-800 rounded-full px-5 text-sm disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </div>
      </div>

      {/* Cover Image Editor Modal */}
      {showCoverEditor && tempCoverImage && (
        <CoverImageEditor
          imageUrl={tempCoverImage}
          onSave={handleCoverEditorSave}
          onCancel={handleCoverEditorCancel}
          aspectRatio={16 / 9}
        />
      )}
    </div>
  );
}
