"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Lock, Unlock } from "lucide-react";
import { toast } from 'sonner';
import { CoverImageEditor } from "@/components/CoverImageEditor";

interface CreateCommunityFormProps {
    onCreateCommunity: (name: string, description: string, topics: string[], photo?: File, cover?: File, isClosed?: boolean) => Promise<void>;
    creatingCommunity: boolean;
    communityLogoFile: File | null;
    setCommunityLogoFile: (file: File | null) => void;
    communityLogoPreview: string;
    setCommunityLogoPreview: (url: string) => void;
    communityCoverFile: File | null;
    setCommunityCoverFile: (file: File | null) => void;
    communityCoverPreview: string;
    setCommunityCoverPreview: (url: string) => void;
    showCommunityLogoEditor: boolean;
    setShowCommunityLogoEditor: (show: boolean) => void;
    showCommunityCoverEditor: boolean;
    setShowCommunityCoverEditor: (show: boolean) => void;
    tempCommunityLogoImage: string;
    setTempCommunityLogoImage: (url: string) => void;
    tempCommunityCoverImage: string;
    setTempCommunityCoverImage: (url: string) => void;
}

export const CreateCommunityForm: React.FC<CreateCommunityFormProps> = ({
    onCreateCommunity,
    creatingCommunity,
    communityLogoFile,
    setCommunityLogoFile,
    communityLogoPreview,
    setCommunityLogoPreview,
    communityCoverFile,
    setCommunityCoverFile,
    communityCoverPreview,
    setCommunityCoverPreview,
    showCommunityLogoEditor,
    setShowCommunityLogoEditor,
    showCommunityCoverEditor,
    setShowCommunityCoverEditor,
    tempCommunityLogoImage,
    setTempCommunityLogoImage,
    tempCommunityCoverImage,
    setTempCommunityCoverImage,
}) => {
    const handleSubmit = () => {
        const nameElement = document.getElementById('community-name') as HTMLInputElement;
        const descriptionElement = document.getElementById('community-description') as HTMLTextAreaElement;
        const topicsElement = document.getElementById('community-topics') as HTMLInputElement;
        const communityTypeInput = document.querySelector('input[name="community-type"]:checked') as HTMLInputElement;

        const name = nameElement?.value || "";
        const description = descriptionElement?.value || "";
        const topicString = topicsElement?.value || "";
        const topicsArray = topicString.split(',').map(t => t.trim()).filter(t => t);
        const photo = communityLogoFile || undefined;
        const cover = communityCoverFile || undefined;
        const isClosed = communityTypeInput?.value === 'closed';

        if (name && description && topicsArray.length > 0) {
            onCreateCommunity(name, description, topicsArray, photo, cover, isClosed);
            setCommunityCoverFile(null);
            setCommunityCoverPreview("");
            setCommunityLogoFile(null);
            setCommunityLogoPreview("");
        } else {
            toast.warning("Please fill in all fields");
        }
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6">
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                {/* Name */}
                <div className="flex flex-col">
                    <label className="text-slate-600 dark:text-slate-300 font-medium mb-1 text-xs">Name</label>
                    <input
                        type="text"
                        placeholder="Community name"
                        className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 focus:border-indigo-400"
                        id="community-name"
                    />
                </div>

                {/* Description */}
                <div className="flex flex-col">
                    <label className="text-slate-600 dark:text-slate-300 font-medium mb-1 text-xs">Description</label>
                    <textarea
                        placeholder="Describe your community"
                        className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 p-2.5 rounded-lg text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 focus:border-indigo-400"
                        id="community-description"
                    />
                </div>

                {/* Topics */}
                <div className="flex flex-col">
                    <label className="text-slate-600 dark:text-slate-300 font-medium mb-1 text-xs">Topics (comma separated)</label>
                    <input
                        type="text"
                        placeholder="tech, news, gaming"
                        className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 focus:border-indigo-400"
                        id="community-topics"
                    />
                </div>

                {/* Images */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Logo */}
                    <div className="flex flex-col">
                        <label className="text-slate-600 dark:text-slate-300 font-medium mb-1 text-xs">Logo</label>
                        {communityLogoPreview ? (
                            <div className="relative group">
                                <img
                                    src={communityLogoPreview}
                                    alt="Logo preview"
                                    className="w-14 h-14 object-cover rounded-lg border border-slate-200"
                                />
                                <div
                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-lg"
                                    onClick={() => {
                                        setTempCommunityLogoImage(communityLogoPreview);
                                        setShowCommunityLogoEditor(true);
                                    }}
                                >
                                    <span className="text-white text-[10px] font-medium">Edit</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCommunityLogoPreview("");
                                        setCommunityLogoFile(null);
                                    }}
                                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center hover:bg-red-600"
                                >
                                    ×
                                </button>
                            </div>
                        ) : (
                            <input
                                type="file"
                                accept="image/*"
                                className="bg-slate-50 border border-slate-200 text-slate-900 p-1.5 rounded-lg file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-medium file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 text-xs"
                                id="community-photo"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        const file = e.target.files[0];
                                        const reader = new FileReader();
                                        reader.onload = (ev) => {
                                            if (ev.target?.result) {
                                                setTempCommunityLogoImage(ev.target.result as string);
                                                setShowCommunityLogoEditor(true);
                                            }
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />
                        )}
                    </div>

                    {/* Cover */}
                    <div className="flex flex-col">
                        <label className="text-slate-600 dark:text-slate-300 font-medium mb-1 text-xs">Cover</label>
                        {communityCoverPreview ? (
                            <div className="relative group">
                                <img
                                    src={communityCoverPreview}
                                    alt="Cover preview"
                                    className="w-full h-14 object-cover rounded-lg border border-slate-200"
                                />
                                <div
                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-lg"
                                    onClick={() => {
                                        setTempCommunityCoverImage(communityCoverPreview);
                                        setShowCommunityCoverEditor(true);
                                    }}
                                >
                                    <span className="text-white text-[10px] font-medium">Edit</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCommunityCoverPreview("");
                                        setCommunityCoverFile(null);
                                    }}
                                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center hover:bg-red-600"
                                >
                                    ×
                                </button>
                            </div>
                        ) : (
                            <input
                                type="file"
                                accept="image/*"
                                className="bg-slate-50 border border-slate-200 text-slate-900 p-1.5 rounded-lg file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-medium file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 text-xs"
                                id="community-cover"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        const file = e.target.files[0];
                                        const reader = new FileReader();
                                        reader.onload = (ev) => {
                                            if (ev.target?.result) {
                                                setTempCommunityCoverImage(ev.target.result as string);
                                                setShowCommunityCoverEditor(true);
                                            }
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Community Type */}
                <div className="flex flex-col">
                    <label className="text-slate-600 dark:text-slate-300 font-medium mb-1 text-xs">Community Type</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30 transition-all has-[:checked]:border-indigo-400 dark:has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50 dark:has-[:checked]:bg-indigo-900/40">
                            <input
                                type="radio"
                                name="community-type"
                                value="open"
                                defaultChecked
                                className="accent-indigo-600 w-3.5 h-3.5"
                            />
                            <Unlock className="w-4 h-4 text-green-500 dark:text-green-400" />
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Open</span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">Anyone can view content</span>
                            </div>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30 transition-all has-[:checked]:border-indigo-400 dark:has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50 dark:has-[:checked]:bg-indigo-900/40">
                            <input
                                type="radio"
                                name="community-type"
                                value="closed"
                                className="accent-indigo-600 w-3.5 h-3.5"
                            />
                            <Lock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Closed</span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">Members only</span>
                            </div>
                        </label>
                    </div>
                </div>

                <Button
                    type="button"
                    onClick={handleSubmit}
                    className="w-full bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg py-2 text-sm font-medium shadow-sm shadow-indigo-200 dark:shadow-indigo-900/50 transition-all mt-1"
                    disabled={creatingCommunity}
                >
                    {creatingCommunity ? (
                        <span className="animate-pulse">Creating...</span>
                    ) : "Create Community"}
                </Button>
            </form>

            {/* Logo Editor Modal */}
            {showCommunityLogoEditor && tempCommunityLogoImage && (
                <CoverImageEditor
                    imageUrl={tempCommunityLogoImage}
                    onSave={(croppedBlob) => {
                        const file = new File([croppedBlob], 'community-logo.jpg', { type: 'image/jpeg' });
                        setCommunityLogoFile(file);
                        const url = URL.createObjectURL(croppedBlob);
                        setCommunityLogoPreview(url);
                        setShowCommunityLogoEditor(false);
                        setTempCommunityLogoImage("");
                    }}
                    onCancel={() => {
                        setShowCommunityLogoEditor(false);
                        setTempCommunityLogoImage("");
                    }}
                    aspectRatio={1}
                />
            )}

            {/* Cover Editor Modal */}
            {showCommunityCoverEditor && tempCommunityCoverImage && (
                <CoverImageEditor
                    imageUrl={tempCommunityCoverImage}
                    onSave={(croppedBlob) => {
                        const file = new File([croppedBlob], 'community-cover.jpg', { type: 'image/jpeg' });
                        setCommunityCoverFile(file);
                        const url = URL.createObjectURL(croppedBlob);
                        setCommunityCoverPreview(url);
                        setShowCommunityCoverEditor(false);
                        setTempCommunityCoverImage("");
                    }}
                    onCancel={() => {
                        setShowCommunityCoverEditor(false);
                        setTempCommunityCoverImage("");
                    }}
                    aspectRatio={16 / 9}
                />
            )}
        </div>
    );
};
