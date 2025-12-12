"use client";
import { WalletConnect } from '@/components/WalletConnect';
import { ThemeToggle } from '@/components/theme-toggle';
import { Loading } from '@/components/Loading';
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from 'next/navigation';
import { useWalletContext } from "@/contexts/WalletContext";
import { useCommunitySettings } from "@/contexts/CommunitySettingsContext";
import { forumAddress, forumABI } from "@/contracts/DecentralizedForum_V3.3";
import { IntegratedView } from '@/components/IntegratedView';
import { Users } from 'lucide-react';
import {
    useCommunities,
    useCommunityPosts,
    useCreateCommunity,
    useJoinCommunity,
    useLeaveCommunity,
} from '@/hooks/queries';
import type { Community, Post } from '@/types/forum';

export default function Home() {
    const { isConnected, provider } = useWalletContext();
    const { setCommunityType } = useCommunitySettings();
    const searchParams = useSearchParams();

    // UI State
    const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
    const [showCommunityList, setShowCommunityList] = useState(true);
    const [isCreatingCommunity, setIsCreatingCommunity] = useState(false);

    // React Query hooks
    const {
        data: communities = [],
        isLoading: isLoadingCommunities,
        refetch: refetchCommunities,
    } = useCommunities();

    const {
        data: posts = [],
        isLoading: isLoadingPosts,
        refetch: refetchPosts,
    } = useCommunityPosts(selectedCommunityId);

    // Mutations
    const createCommunityMutation = useCreateCommunity();
    const joinCommunityMutation = useJoinCommunity();
    const leaveCommunityMutation = useLeaveCommunity();

    // Handle URL query parameter for community selection
    useEffect(() => {
        const communityFromUrl = searchParams.get('community');
        if (communityFromUrl && communities.length > 0 && !selectedCommunityId) {
            const urlCommunity = communities.find(c => c.id === communityFromUrl);
            if (urlCommunity && (urlCommunity.isMember || urlCommunity.isCreator)) {
                setSelectedCommunityId(urlCommunity.id);
                setShowCommunityList(false);
            }
        }
    }, [searchParams, communities, selectedCommunityId]);

    // Auto-select first community if none selected
    useEffect(() => {
        if (!selectedCommunityId && communities.length > 0 && !searchParams.get('community')) {
            setSelectedCommunityId(communities[0].id);
        }
    }, [communities, selectedCommunityId, searchParams]);

    // Handlers
    const handleCreateCommunity = async (
        name: string,
        description: string,
        communityTopics: string[],
        photo?: File,
        coverImage?: File,
        isClosed: boolean = false
    ) => {
        try {
            await createCommunityMutation.mutateAsync({
                name,
                description,
                topics: communityTopics,
                photo,
                coverImage,
                isClosed,
            });

            // Get the latest community ID after creation
            const updatedCommunities = await refetchCommunities();
            if (updatedCommunities.data && updatedCommunities.data.length > 0) {
                // Find the community created by this user (most recent one)
                const latestCommunity = updatedCommunities.data[updatedCommunities.data.length - 1];
                if (latestCommunity) {
                    setCommunityType(latestCommunity.id, isClosed, latestCommunity.creator);
                }
            }

            alert(`Community created successfully! ${isClosed ? '(Closed community)' : '(Open community)'}`);
        } catch (error: any) {
            console.error("Error creating community:", error);
            alert(`Error creating community: ${error.message || 'Unknown error'}`);
        }
    };

    const handleJoinCommunity = async (communityId: string) => {
        try {
            await joinCommunityMutation.mutateAsync(communityId);
            // Navigate to posts view after successful join
            setTimeout(() => {
                setShowCommunityList(false);
            }, 500);
        } catch (error: any) {
            console.error("Error joining community:", error);
            if (error.message?.includes("Already a member")) {
                alert("You are already a member of this community.");
            } else {
                alert("Error joining community. Check console.");
            }
        }
    };

    const handleLeaveCommunity = async (communityId: string) => {
        const community = communities.find(c => c.id === communityId);
        if (community?.isCreator) {
            alert("As the creator of this community, you cannot leave it.");
            return;
        }

        try {
            await leaveCommunityMutation.mutateAsync(communityId);
        } catch (error) {
            console.error("Error leaving community:", error);
            alert("Error leaving community. Check console.");
        }
    };

    const fetchPostsForCommunity = async (communityId: string) => {
        setSelectedCommunityId(communityId);
        // React Query will automatically refetch when communityId changes
    };

    const fetchPostsFromContract = async () => {
        if (selectedCommunityId) {
            await refetchPosts();
        }
    };

    const isLoading = isLoadingCommunities || isLoadingPosts;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f5f7ff] via-[#fdfbff] to-[#e6f0ff] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <header className="mb-10">
                    <div className="flex justify-between items-center">
                        <a href="/" className="block">
                            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Node Speak v3.3</h1>
                        </a>
                        <div className="flex items-center gap-3">
                            <ThemeToggle />
                            <WalletConnect />
                        </div>
                    </div>
                    {!showCommunityList && (
                        <div className="mt-4">
                            <button
                                onClick={() => setShowCommunityList(true)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-medium text-sm shadow-lg shadow-sky-200 dark:shadow-sky-900/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                            >
                                <Users className="w-4 h-4" />
                                Communities
                            </button>
                        </div>
                    )}
                </header>

                <main className="space-y-6">
                    {!isConnected && (
                        <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300">
                            <p className="text-sm">
                                You can explore public communities without connecting your wallet. Connect when you want to create, join or interact.
                            </p>
                        </div>
                    )}

                    {/* Loading state - Skeleton */}
                    {isLoading && showCommunityList && (
                        <Loading type="forum-community-list" count={6} />
                    )}
                    {isLoading && !showCommunityList && selectedCommunityId && (
                        <Loading type="forum-posts" count={5} />
                    )}

                    <IntegratedView
                        communities={communities}
                        posts={posts}
                        fetchPostsFromContract={fetchPostsFromContract}
                        forumAddress={forumAddress}
                        forumABI={forumABI}
                        provider={provider}
                        isCreatingCommunity={isCreatingCommunity}
                        setIsCreatingCommunity={setIsCreatingCommunity}
                        handleCreateCommunity={handleCreateCommunity}
                        handleJoinCommunity={handleJoinCommunity}
                        handleLeaveCommunity={handleLeaveCommunity}
                        isLoading={isLoading}
                        creatingCommunity={createCommunityMutation.isPending}
                        joiningCommunityId={joinCommunityMutation.isPending ? (joinCommunityMutation.variables as string) : null}
                        leavingCommunityId={leaveCommunityMutation.isPending ? (leaveCommunityMutation.variables as string) : null}
                        selectedCommunityId={selectedCommunityId}
                        setSelectedCommunityId={setSelectedCommunityId}
                        fetchPostsForCommunity={fetchPostsForCommunity}
                        showCommunityList={showCommunityList}
                        setShowCommunityList={setShowCommunityList}
                        refreshCommunities={async () => { await refetchCommunities(); }}
                    />
                </main>
            </div>
        </div>
    );
}
