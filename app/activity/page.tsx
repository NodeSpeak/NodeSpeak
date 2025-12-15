"use client";

import { WalletConnect } from '@/components/WalletConnect';
import { UserAvatar } from '@/components/UserAvatar';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { ActivityLoadingSkeleton } from '@/components/skeletons/PostSkeleton';
import { useState, useEffect, useMemo } from "react";
import DOMPurify from 'dompurify';
import { Contract } from "ethers";
import { useWalletContext } from "@/contexts/WalletContext";
import { forumAddress, forumABI } from "@/contracts/DecentralizedForum_V3.3";
import { Clock, MessageSquare, Heart, Users, ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { prefetchFeedImages } from '@/lib/ipfsPrefetch';
import { useActivityFeed, useUpdateCommunityMembership } from '@/hooks/queries';

export default function ActivityPage() {
    const { isConnected, provider, address, connect } = useWalletContext();
    const router = useRouter();
    const queryClient = useQueryClient();
    
    // Use React Query hook for activity feed
    const { data: communities = [], isLoading, refetch } = useActivityFeed(5);
    const updateMembership = useUpdateCommunityMembership();
    
    const [joiningCommunityId, setJoiningCommunityId] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [pendingJoinCommunityId, setPendingJoinCommunityId] = useState<string | null>(null);

    // Format timestamp to relative time
    const formatRelativeTime = (timestamp: number) => {
        const now = Date.now() / 1000;
        const diff = now - timestamp;

        if (diff < 60) return "Just now";
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
        return new Date(timestamp * 1000).toLocaleDateString();
    };

    // Strip HTML tags and truncate content for preview
    const stripHtmlAndTruncate = (content: string, maxLength: number = 150) => {
        if (typeof content !== 'string') return '';
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = DOMPurify.sanitize(content);
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        if (textContent.length <= maxLength) return textContent;
        return textContent.slice(0, maxLength) + '...';
    };

    // Prefetch images when communities are loaded
    useEffect(() => {
        if (communities.length > 0) {
            const allPosts = communities.flatMap(c => c.posts);
            prefetchFeedImages(queryClient, {
                posts: allPosts.map(p => ({ imageCID: p.imageUrl })),
                communities: communities.map(c => ({ image: c.photo }))
            });
        }
    }, [communities, queryClient]);

    // Effect to join community after wallet connection
    useEffect(() => {
        if (isConnected && provider && pendingJoinCommunityId) {
            handleJoinCommunity(pendingJoinCommunityId);
            setPendingJoinCommunityId(null);
        }
    }, [isConnected, provider, pendingJoinCommunityId]);

    // Handle wallet connection
    const handleConnect = async (communityIdToJoin?: string) => {
        if (communityIdToJoin) {
            setPendingJoinCommunityId(communityIdToJoin);
        }
        setIsConnecting(true);
        try {
            await connect();
        } catch (error) {
            console.error("Error connecting:", error);
            setPendingJoinCommunityId(null);
        } finally {
            setIsConnecting(false);
        }
    };

    // Handle navigation to forum
    const handleGoToForo = async () => {
        if (!isConnected) {
            setIsConnecting(true);
            try {
                await connect();
            } catch (error) {
                console.error("Error connecting before navigating to foro:", error);
                setIsConnecting(false);
                return;
            }
            setIsConnecting(false);
        }
        router.push('/foro');
    };

    // Join a community with optimistic update
    const handleJoinCommunity = async (communityId: string) => {
        if (!provider || !isConnected) {
            toast.error("Please connect your wallet first.");
            return;
        }

        try {
            setJoiningCommunityId(communityId);

            const signer = await provider.getSigner();
            const contract = new Contract(forumAddress, forumABI, signer);
            const userAddress = await signer.getAddress();
            
            // Check if already a member
            const isMember = await contract.isMember(communityId, userAddress);
            if (isMember) {
                updateMembership(communityId, true, 0);
                setJoiningCommunityId(null);
                return;
            }

            // Optimistic update
            updateMembership(communityId, true, 1);

            // Execute transaction
            const tx = await contract.joinCommunity(communityId);
            await tx.wait();

            toast.success("Successfully joined community!");

        } catch (error: any) {
            console.error("Error joining community:", error);

            if (error.message?.includes("Already a member")) {
                updateMembership(communityId, true, 0);
            } else {
                // Rollback optimistic update
                updateMembership(communityId, false, -1);
                toast.error("Error joining community. Check console.");
            }
        } finally {
            setJoiningCommunityId(null);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f5f7ff] via-[#fdfbff] to-[#e6f0ff] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Header */}
                <header className="mb-10">
                    <div className="flex justify-between items-center">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-200 dark:shadow-sky-900/50">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">Node Speak v3.3</h1>
                        </Link>
                        <div className="flex items-center gap-4">
                            <ThemeToggle />
                            {isConnected ? (
                                <WalletConnect />
                            ) : (
                                <button
                                    onClick={() => handleConnect()}
                                    disabled={isConnecting}
                                    className="inline-flex items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-200 dark:hover:bg-sky-800/50 transition-colors text-xs font-medium px-5 py-2 h-auto shadow-sm disabled:opacity-70"
                                >
                                    {isConnecting ? "Connecting..." : "Connect"}
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Title */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-900/50 dark:to-violet-800/30 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">Recent Activity</h2>
                        </div>
                        <Link
                            href="/foro"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-medium text-sm shadow-lg shadow-sky-200 dark:shadow-sky-900/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                        >
                            <Users className="w-4 h-4" />
                            Communities
                        </Link>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 ml-13">Latest posts from all communities</p>
                </div>

                {/* Loading State */}
                {isLoading && <ActivityLoadingSkeleton communityCount={3} />}

                {/* Empty State */}
                {!isLoading && communities.length === 0 && (
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 dark:border-slate-700 p-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">No activity yet</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">Be the first to create a post in a community!</p>
                        <button
                            type="button"
                            onClick={handleGoToForo}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-medium text-sm shadow-lg shadow-sky-200 dark:shadow-sky-900/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                        >
                            <Users className="w-4 h-4" />
                            Browse Communities
                        </button>
                    </div>
                )}

                {/* Communities with Posts */}
                {!isLoading && communities.length > 0 && (
                    <div className="space-y-8">
                        {communities.map((community, index) => (
                            <div
                                key={community.id}
                                className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/40 dark:shadow-slate-900/40 border border-white/60 dark:border-slate-700 overflow-hidden ${
                                    index < 5 ? `stagger-item-${index + 1}` : 'animate-slideInUp'
                                }`}
                            >
                                {/* Community Header */}
                                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-slate-50/80 dark:from-slate-700/50 to-transparent">
                                    <div className="flex items-center justify-between">
                                        <Link 
                                            href={`/foro?community=${community.id}`}
                                            className="flex items-center gap-4 hover:opacity-80 transition-opacity"
                                        >
                                            {community.photo ? (
                                                <ImageWithFallback
                                                    cid={community.photo}
                                                    alt={community.name}
                                                    className="w-12 h-12 rounded-xl object-cover shadow-md"
                                                    fallback={
                                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-100 to-indigo-100 dark:from-sky-900/50 dark:to-indigo-900/50 flex items-center justify-center shadow-md">
                                                            <Users className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                                                        </div>
                                                    }
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-100 to-indigo-100 dark:from-sky-900/50 dark:to-indigo-900/50 flex items-center justify-center shadow-md">
                                                    <Users className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg">{community.name}</h3>
                                                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <Users className="w-3.5 h-3.5" />
                                                        {community.memberCount} members
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MessageSquare className="w-3.5 h-3.5" />
                                                        {community.postCount} posts
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                        {isConnected ? (
                                            community.isMember ? (
                                                <Link
                                                    href={`/foro?community=${community.id}`}
                                                    className="text-sm font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1 transition-colors"
                                                >
                                                    View all
                                                    <ArrowRight className="w-4 h-4" />
                                                </Link>
                                            ) : (
                                                <button
                                                    onClick={() => handleJoinCommunity(community.id)}
                                                    disabled={joiningCommunityId === community.id}
                                                    className={`text-sm font-medium px-4 py-1.5 rounded-full transition-all ${
                                                        joiningCommunityId === community.id
                                                            ? "bg-slate-200 text-slate-500"
                                                            : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                                    }`}
                                                >
                                                    {joiningCommunityId === community.id ? "Joining..." : "Join"}
                                                </button>
                                            )
                                        ) : (
                                            <button
                                                onClick={() => handleConnect(community.id)}
                                                disabled={isConnecting}
                                                className="text-sm font-medium px-4 py-1.5 rounded-full transition-all bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-70"
                                            >
                                                {isConnecting && pendingJoinCommunityId === community.id ? "Connecting..." : "Join"}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Posts */}
                                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {community.posts.map((post) => (
                                        <div 
                                            key={post.id}
                                            className="px-6 py-5 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors"
                                        >
                                            <div className="flex gap-4">
                                                <div className="flex-shrink-0">
                                                    <UserAvatar 
                                                        address={post.author} 
                                                        size="md" 
                                                        showNickname={false}
                                                    />
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                        <UserAvatar 
                                                            address={post.author} 
                                                            size="sm" 
                                                            showNickname={true}
                                                            className="[&>div:first-child]:hidden"
                                                        />
                                                        {post.topic && (
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                                                {post.topic}
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 ml-auto">
                                                            <Clock className="w-3 h-3" />
                                                            {formatRelativeTime(post.timestamp)}
                                                        </span>
                                                    </div>
                                                    
                                                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-3">
                                                        {stripHtmlAndTruncate(post.content)}
                                                    </p>
                                                    
                                                    {post.imageUrl && (
                                                        <div className="mb-3">
                                                            <ImageWithFallback
                                                                cid={post.imageUrl}
                                                                alt=""
                                                                className="w-full max-w-md h-48 rounded-xl object-cover shadow-md border border-slate-200 dark:border-slate-600"
                                                                fallback={
                                                                    <div className="w-full max-w-md h-48 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500">
                                                                        Image unavailable
                                                                    </div>
                                                                }
                                                            />
                                                        </div>
                                                    )}
                                                    
                                                    <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                                                        <span className="flex items-center gap-1 hover:text-red-500 transition-colors cursor-pointer">
                                                            <Heart className="w-3.5 h-3.5" />
                                                            {post.likeCount}
                                                        </span>
                                                        <span className="flex items-center gap-1 hover:text-sky-500 transition-colors cursor-pointer">
                                                            <MessageSquare className="w-3.5 h-3.5" />
                                                            {post.commentCount}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
