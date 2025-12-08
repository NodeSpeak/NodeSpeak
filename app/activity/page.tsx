"use client";
import { WalletConnect } from '@/components/WalletConnect';
import { UserAvatar } from '@/components/UserAvatar';
import { useState, useEffect } from "react";
import DOMPurify from 'dompurify';
import { Contract, JsonRpcProvider } from "ethers";
import { useWalletContext } from "@/contexts/WalletContext";
import axios from 'axios';
import { forumAddress, forumABI } from "@/contracts/DecentralizedForum_V3.3";
import { Clock, MessageSquare, Heart, Users, ArrowRight, Sparkles, TrendingUp, Wallet } from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Public RPC for Arbitrum One - allows reading without wallet connection
const ARBITRUM_RPC = "https://arb1.arbitrum.io/rpc";

const PINATA_GATEWAY = "https://ipfs.io/ipfs/";
const BACKUP_GATEWAY = "https://ipfs.io/ipfs/";

// Cache for content
const contentCache = new Map();
const communityDataCache = new Map();

interface Post {
    id: string;
    title: string;
    content: string;
    timestamp: number;
    author: string;
    imageUrl?: string;
    cid: string;
    topic: string;
    communityId: string;
    likeCount: number;
    commentCount: number;
    isActive: boolean;
}

interface Community {
    id: string;
    name: string;
    description: string;
    postCount: number;
    memberCount: number;
    photo?: string;
    posts: Post[];
    isMember: boolean;
}

export default function ActivityPage() {
    const { isConnected, provider, address, connect } = useWalletContext();
    const router = useRouter();
    const [communities, setCommunities] = useState<Community[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [joiningCommunityId, setJoiningCommunityId] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [pendingJoinCommunityId, setPendingJoinCommunityId] = useState<string | null>(null);

    // Create a public provider for reading data without wallet
    const getReadProvider = () => {
        return new JsonRpcProvider(ARBITRUM_RPC);
    };

    // Helper function to fetch IPFS content
    const fetchFromIPFS = async (cid: string) => {
        if (!cid) return null;
        if (contentCache.has(cid)) {
            return contentCache.get(cid);
        }

        const gateways = [PINATA_GATEWAY, BACKUP_GATEWAY, "https://cloudflare-ipfs.com/ipfs/", "https://dweb.link/ipfs/"];

        for (const gateway of gateways) {
            try {
                const response = await axios.get(`${gateway}${cid}`, {
                    timeout: 5000,
                    validateStatus: (status) => status === 200
                });
                contentCache.set(cid, response.data);
                return response.data;
            } catch (error) {
                continue;
            }
        }

        contentCache.set(cid, "Content unavailable");
        return "Content unavailable";
    };

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

    // Truncate address
    const truncateAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    // Strip HTML tags and truncate content for preview
    const stripHtmlAndTruncate = (content: string, maxLength: number = 150) => {
        if (typeof content !== 'string') return '';
        // Create a temporary element to parse HTML and extract text
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = DOMPurify.sanitize(content);
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        if (textContent.length <= maxLength) return textContent;
        return textContent.slice(0, maxLength) + '...';
    };

    // Fetch all activity - works without wallet connection
    const fetchActivity = async () => {
        try {
            setIsLoading(true);
            // Use public provider for reading, wallet provider for membership checks
            const readProvider = getReadProvider();
            const contract = new Contract(forumAddress, forumABI, readProvider);
            const communitiesFromContract = await contract.getActiveCommunities();

            const communitiesWithPosts: Community[] = [];

            for (const community of communitiesFromContract) {
                const id = community.id.toString();
                let name = `Community #${id}`;
                let description = "";
                let photo = "";

                // Get community data from IPFS
                const cacheKey = `community_${id}`;
                if (communityDataCache.has(cacheKey)) {
                    const cached = communityDataCache.get(cacheKey);
                    name = cached.name;
                    description = cached.description;
                    photo = cached.photo || "";
                } else {
                    try {
                        const communityData = await fetchFromIPFS(community.contentCID);
                        if (communityData) {
                            name = communityData.name || name;
                            description = communityData.description || "";
                            photo = communityData.photo || "";
                            communityDataCache.set(cacheKey, { name, description, photo });
                        }
                    } catch (err) {
                        console.error(`Error getting data for community ${id}:`, err);
                    }
                }

                // Get member count and check membership
                let memberCount = 0;
                let isMember = false;
                try {
                    const count = await contract.getCommunityMemberCount(id);
                    memberCount = parseInt(count.toString(), 10);
                    
                    // Check if user is a member (only if connected)
                    if (isConnected && address) {
                        isMember = await contract.isMember(id, address);
                    }
                } catch (err) {
                    console.error(`Error getting member count for community ${id}:`, err);
                }

                // Get posts for this community
                try {
                    const postsFromContract = await contract.getCommunityPosts(id);
                    const activePosts = postsFromContract.filter((post: any) => post.isActive);

                    const posts: Post[] = await Promise.all(
                        activePosts.slice(0, 5).map(async (post: any) => {
                            const postId = parseInt(post.id.toString(), 10);
                            let content = "";

                            try {
                                const postContent = await fetchFromIPFS(post.contentCID);
                                content = typeof postContent === 'string' ? postContent : postContent?.content || "";
                            } catch (err) {
                                console.error(`Error getting content for post ${postId}`, err);
                            }

                            let imageUrl = undefined;
                            if (post.imageCID && post.imageCID !== "") {
                                imageUrl = `${BACKUP_GATEWAY}${post.imageCID}`;
                            }

                            return {
                                id: postId.toString(),
                                title: post.title,
                                content,
                                timestamp: parseInt(post.timestamp.toString(), 10),
                                author: post.author,
                                imageUrl,
                                cid: post.contentCID,
                                topic: post.topic,
                                communityId: id,
                                likeCount: parseInt(post.likeCount.toString(), 10),
                                commentCount: parseInt(post.commentCount.toString(), 10),
                                isActive: post.isActive
                            };
                        })
                    );

                    // Sort by timestamp (newest first)
                    posts.sort((a, b) => b.timestamp - a.timestamp);

                    if (posts.length > 0) {
                        communitiesWithPosts.push({
                            id,
                            name,
                            description,
                            postCount: parseInt(community.postCount.toString(), 10),
                            memberCount,
                            photo,
                            posts,
                            isMember
                        });
                    }
                } catch (err) {
                    console.error(`Error getting posts for community ${id}:`, err);
                }
            }

            // Sort communities by most recent post
            communitiesWithPosts.sort((a, b) => {
                const aLatest = a.posts[0]?.timestamp || 0;
                const bLatest = b.posts[0]?.timestamp || 0;
                return bLatest - aLatest;
            });

            setCommunities(communitiesWithPosts);
        } catch (error) {
            console.error("Error fetching activity:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Fetch activity on mount - no wallet required
        fetchActivity();
    }, [isConnected, address]); // Re-fetch when connection status changes to update membership

    // Effect to join community after wallet connection
    useEffect(() => {
        if (isConnected && provider && pendingJoinCommunityId) {
            handleJoinCommunity(pendingJoinCommunityId);
            setPendingJoinCommunityId(null);
        }
    }, [isConnected, provider, pendingJoinCommunityId]);

    // Handle wallet connection (optionally with pending community to join)
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

    // Handle navigation to forum ensuring wallet connection first
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

    // Join a community
    const handleJoinCommunity = async (communityId: string) => {
        if (!provider || !isConnected) {
            alert("Please connect your wallet first.");
            return;
        }

        try {
            setJoiningCommunityId(communityId);

            const signer = await provider.getSigner();
            const contract = new Contract(forumAddress, forumABI, signer);

            // Verify if already a member
            const userAddress = await signer.getAddress();
            const isMember = await contract.isMember(communityId, userAddress);

            if (isMember) {
                // Update state locally without transaction
                setCommunities(prev => prev.map(community => {
                    if (community.id === communityId) {
                        return { ...community, isMember: true };
                    }
                    return community;
                }));
                setJoiningCommunityId(null);
                return;
            }

            // If not a member, proceed with transaction
            const tx = await contract.joinCommunity(communityId);
            await tx.wait();

            // Update community list
            setCommunities(prev => prev.map(community => {
                if (community.id === communityId) {
                    return { ...community, isMember: true, memberCount: community.memberCount + 1 };
                }
                return community;
            }));

        } catch (error: any) {
            console.error("Error joining community:", error);

            if (error.message && error.message.includes("Already a member")) {
                setCommunities(prev => prev.map(community => {
                    if (community.id === communityId) {
                        return { ...community, isMember: true };
                    }
                    return community;
                }));
            } else {
                alert("Error joining community. Check console.");
            }
        } finally {
            setJoiningCommunityId(null);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f5f7ff] via-[#fdfbff] to-[#e6f0ff]">
            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Header with Connect button on the right */}
                <header className="mb-10">
                    <div className="flex justify-between items-center">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-200">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Node Speak v3.3</h1>
                        </Link>
                        <div className="flex items-center gap-4">
                            {isConnected ? (
                                <WalletConnect />
                            ) : (
                                <button
                                    onClick={() => handleConnect()}
                                    disabled={isConnecting}
                                    className="inline-flex items-center justify-center rounded-full bg-sky-100 text-sky-800 border border-sky-200 hover:bg-sky-200 transition-colors text-xs font-medium px-5 py-2 h-auto shadow-sm disabled:opacity-70"
                                >
                                    {isConnecting ? "Connecting..." : "Connect"}
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Title */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-violet-50 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-violet-600" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Recent Activity</h2>
                    </div>
                    <p className="text-slate-500 ml-13">Latest posts from all communities</p>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="w-12 h-12 rounded-full border-4 border-sky-200 border-t-sky-500 animate-spin mx-auto mb-4"></div>
                            <p className="text-slate-500">Loading activity...</p>
                        </div>
                    </div>
                )}

                {/* Communities with Posts */}
                {!isLoading && communities.length === 0 && (
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">No activity yet</h3>
                        <p className="text-slate-500 mb-6">Be the first to create a post in a community!</p>
                        <button
                            type="button"
                            onClick={handleGoToForo}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-slate-900 to-slate-800 text-white font-medium text-sm shadow-lg hover:shadow-xl transition-all"
                        >
                            Browse Communities
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {!isLoading && communities.length > 0 && (
                    <div className="space-y-8">
                        {communities.map((community) => (
                            <div 
                                key={community.id}
                                className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/40 border border-white/60 overflow-hidden"
                            >
                                {/* Community Header */}
                                <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-transparent">
                                    <div className="flex items-center justify-between">
                                        <Link 
                                            href={`/foro?community=${community.id}`}
                                            className="flex items-center gap-4"
                                        >
                                            {community.photo ? (
                                                <img 
                                                    src={`${BACKUP_GATEWAY}${community.photo}`}
                                                    alt={community.name}
                                                    className="w-12 h-12 rounded-xl object-cover shadow-md"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-100 to-indigo-100 flex items-center justify-center shadow-md">
                                                    <Users className="w-6 h-6 text-sky-600" />
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="font-semibold text-slate-900 text-lg">{community.name}</h3>
                                                <div className="flex items-center gap-4 text-sm text-slate-500">
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
                                <div className="divide-y divide-slate-100">
                                    {community.posts.map((post) => (
                                        <div 
                                            key={post.id}
                                            className="px-6 py-5 hover:bg-slate-50/50 transition-colors"
                                        >
                                            <div className="flex gap-4">
                                                {/* Post Image (if exists) */}
                                                {post.imageUrl && (
                                                    <div className="flex-shrink-0">
                                                        <img 
                                                            src={post.imageUrl}
                                                            alt=""
                                                            className="w-20 h-20 rounded-xl object-cover shadow-sm"
                                                        />
                                                    </div>
                                                )}
                                                
                                                {/* Post Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-4 mb-2">
                                                        <p className="text-sm text-slate-600 line-clamp-2 flex-1">
                                                            {stripHtmlAndTruncate(post.content)}
                                                        </p>
                                                        <span className="flex-shrink-0 text-xs text-slate-400 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {formatRelativeTime(post.timestamp)}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <UserAvatar 
                                                                address={post.author} 
                                                                size="sm" 
                                                                showNickname={true}
                                                            />
                                                            {post.topic && (
                                                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                                    {post.topic}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-4 text-xs text-slate-400">
                                                            <span className="flex items-center gap-1">
                                                                <Heart className="w-3.5 h-3.5" />
                                                                {post.likeCount}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <MessageSquare className="w-3.5 h-3.5" />
                                                                {post.commentCount}
                                                            </span>
                                                        </div>
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
