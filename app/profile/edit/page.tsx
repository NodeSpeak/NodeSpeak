"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWalletContext } from "@/contexts/WalletContext";
import { useProfileService } from "@/lib/profileService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, User, Save, Upload, ImagePlus, Pencil, UserX, AlertTriangle } from "lucide-react";
import { CoverImageEditor } from "@/components/CoverImageEditor";
import { toast } from "@/hooks/use-toast";
import { useAdminContext } from "@/contexts/AdminContext";
import { Contract } from "ethers";
import { forumAddress, forumABI } from "@/contracts/DecentralizedForum_V3.3";

export default function EditProfilePage() {
  const router = useRouter();
  const { address, ensName, isConnected, provider, disconnect } = useWalletContext();
  const profileService = useProfileService();
  const { hideUser, isUserHidden } = useAdminContext();
  
  const [isLoading, setIsLoading] = useState(true);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
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

  // Handle profile deactivation - generates on-chain transaction
  const handleDeactivateProfile = async () => {
    if (!address || !provider) {
      toast({
        title: "Error",
        description: "Please connect your wallet to deactivate your profile.",
        variant: "destructive",
      });
      return;
    }
    
    setIsDeactivating(true);
    try {
      // Get signer for transaction
      const signer = await provider.getSigner();
      const contract = new Contract(forumAddress, forumABI, signer);
      
      toast({
        title: "⏳ Deactivating Profile",
        description: "Please confirm the transaction in your wallet...",
      });
      
      // Call updateProfile with "[DEACTIVATED]" nickname and empty CIDs to mark as deactivated
      const tx = await contract.updateProfile(
        "[DEACTIVATED]",  // nickname - marks profile as deactivated
        "",               // profileCID - clear profile picture
        "",               // coverCID - clear cover photo  
        ""                // bioCID - clear bio
      );
      
      toast({
        title: "⏳ Processing",
        description: "Waiting for transaction confirmation...",
      });
      
      await tx.wait();
      
      // Also hide user off-chain for immediate effect
      hideUser(address, "User deactivated their own profile");
      
      toast({
        title: "✅ Profile Deactivated",
        description: "Your profile has been deactivated. Your posts and comments will no longer be visible to others.",
      });
      
      setShowDeactivateModal(false);
      
      // Disconnect wallet and redirect to home
      disconnect();
      router.push('/');
    } catch (error: any) {
      console.error("Error deactivating profile:", error);
      
      if (error.message?.includes("user rejected")) {
        toast({
          title: "Transaction Cancelled",
          description: "You cancelled the transaction.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to deactivate profile. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsDeactivating(false);
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
      <div className="min-h-screen bg-gradient-to-br from-[#f5f7ff] via-[#fdfbff] to-[#e6f0ff] dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
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

  // Helper function to shorten Ethereum addresses
  const shortenAddress = (addr: string, chars = 4): string => {
    if (!addr) return '';
    return `${addr.substring(0, chars + 2)}...${addr.substring(addr.length - chars)}`;
  };

  const displayName = ensName || nickname || (address ? shortenAddress(address) : "");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f7ff] via-[#fdfbff] to-[#e6f0ff] dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Profile Card Preview - Same style as /profile */}
        <div className="mb-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden relative">
          {/* Cover Photo as Full Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-sky-100 to-indigo-100">
            {coverPhotoPreview && (
              <img 
                src={coverPhotoPreview} 
                alt="Cover" 
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-white/30 dark:via-slate-900/5 dark:to-slate-900/30"></div>
          </div>
          
          {/* Cover Edit Controls - Floating on top right */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            {coverPhotoPreview && (
              <button
                onClick={handleEditExistingCover}
                className="text-white text-xs py-1.5 px-3 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full border border-white/20 transition-colors flex items-center gap-1.5"
              >
                <Pencil className="w-3 h-3" />
                Adjust
              </button>
            )}
            <Label
              htmlFor="coverPhoto"
              className="cursor-pointer text-white text-xs py-1.5 px-3 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full border border-white/20 transition-colors"
            >
              {coverPhotoPreview ? "Change Cover" : "Upload Cover"}
            </Label>
            <Input
              id="coverPhoto"
              type="file"
              accept="image/*"
              onChange={handleCoverPhotoChange}
              className="hidden"
            />
          </div>
          
          {/* Profile Content - Overlaid on cover */}
          <div className="relative p-6 pt-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-4 py-2 rounded-full">Edit Profile</h1>
            </div>
            
            {/* User profile layout */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* User Avatar Section */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5">
              <div className="flex flex-col items-center">
                <div className="w-full aspect-square rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-600 flex items-center justify-center mb-4 overflow-hidden bg-white dark:bg-slate-700">
                  {profilePicturePreview ? (
                    <img 
                      src={profilePicturePreview} 
                      alt={displayName} 
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <User className="w-16 h-16 text-slate-300 dark:text-slate-500" />
                  )}
                </div>
                
                <div className="text-center text-slate-900 dark:text-slate-100 font-medium text-sm mb-1">
                  {displayName}
                </div>
                
                <div className="text-xs text-slate-500 dark:text-slate-400 text-center break-all">
                  {address}
                </div>
              </div>
              
              <div className="mt-4 flex justify-center">
                <Label
                  htmlFor="profilePicture"
                  className="cursor-pointer text-center text-sky-600 dark:text-sky-400 text-xs py-1.5 px-3 bg-sky-50 dark:bg-sky-900/30 hover:bg-sky-100 dark:hover:bg-sky-900/50 rounded-full border border-sky-200 dark:border-sky-800 transition-colors"
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
            <div className="md:col-span-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5">
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300 text-sm font-medium mb-2 block">Nickname</Label>
                    <Input
                      type="text"
                      id="nickname"
                      placeholder="Enter your nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      disabled={isSaving}
                      className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-sky-400 dark:focus:border-sky-500 focus:ring-sky-200 dark:focus:ring-sky-800 rounded-xl"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300 text-sm font-medium mb-2 block">Address</Label>
                    <div className="text-slate-600 dark:text-slate-300 text-sm font-mono bg-white dark:bg-slate-700 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 truncate">{shortenAddress(address || '', 12)}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300 text-sm font-medium mb-2 block">Status</Label>
                    <span className="inline-flex px-3 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-sm rounded-full">Active</span>
                  </div>
                  
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300 text-sm font-medium mb-2 block">Member Since</Label>
                    <div className="text-slate-600 dark:text-slate-400 text-sm">March 2023</div>
                  </div>
                </div>
                
                <div className="border-t border-slate-200 dark:border-slate-600 pt-5">
                  <Label className="text-slate-700 dark:text-slate-300 text-sm font-medium mb-2 block">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell the community about yourself"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-sky-400 dark:focus:border-sky-500 focus:ring-sky-200 dark:focus:ring-sky-800 rounded-xl resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
            
            {/* Action buttons */}
            <div className="flex justify-between pt-4 mt-4 border-t border-slate-200/50 dark:border-slate-700/50">
            <Button 
              onClick={() => router.push('/profile')}
              className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-full px-5 text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Button>
            
            <div className="flex gap-3">
              <Button 
                onClick={() => setShowDeactivateModal(true)}
                className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full px-5 text-sm"
              >
                <UserX className="h-4 w-4 mr-2" />
                Deactivate Profile
              </Button>
              
              <Button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-slate-900 dark:bg-sky-600 text-white hover:bg-slate-800 dark:hover:bg-sky-700 rounded-full px-5 text-sm disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </div>
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

      {/* Deactivate Profile Confirmation Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Deactivate Profile</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">This action can be reversed later</p>
              </div>
            </div>
            
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
              Are you sure you want to deactivate your profile? Your posts and comments will be hidden from other users.
            </p>
            <p className="text-amber-600 dark:text-amber-400 text-xs mb-6 bg-amber-50 dark:bg-amber-900/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
              ⚠️ <strong>Note:</strong> After deactivating, you must wait a few minutes before you can reactivate your profile due to the blockchain cooldown period.
            </p>
            
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setShowDeactivateModal(false)}
                className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-full px-5 text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeactivateProfile}
                disabled={isDeactivating}
                className="bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-600 rounded-full px-5 text-sm disabled:opacity-50"
              >
                {isDeactivating ? "Deactivating..." : "Yes, Deactivate"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
