"use client";

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Contract, JsonRpcProvider } from 'ethers';
import { useWalletContext } from '@/contexts/WalletContext';
import { forumAddress, forumABI } from '@/contracts/DecentralizedForum_V3.3';
import { fetchContent, getImageUrl } from '@/lib/ipfsClient';

const ARBITRUM_RPC = "https://arb1.arbitrum.io/rpc";

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

interface CommunityWithPosts {
    id: string;
    name: string;
    description: string;
    postCount: number;
    memberCount: number;
    photo?: string;
    posts: Post[];
    isMember: boolean;
}

async function fetchCommunityData(contentCID: string): Promise<{
    name: string;
    description: string;
    photo: string;
} | null> {
    if (!contentCID) return null;
    try {
        const data = await fetchContent(contentCID, { useCache: true });
        return {
            name: data?.name || '',
            description: data?.description || '',
            photo: data?.photo || '',
        };
    } catch {
        return null;
    }
}

async function parsePost(raw: any, communityId: string): Promise<Post> {
    const id = raw.id.toString();
    let content = '';
    
    try {
        const postContent = await fetchContent(raw.contentCID, { useCache: true });
        content = typeof postContent === 'string' ? postContent : postContent?.content || '';
    } catch {
        content = '';
    }

    return {
        id,
        title: raw.title,
        content,
        timestamp: parseInt(raw.timestamp.toString(), 10),
        author: raw.author,
        imageUrl: raw.imageCID && raw.imageCID !== '' ? raw.imageCID : undefined,
        cid: raw.contentCID,
        topic: raw.topic,
        communityId,
        likeCount: parseInt(raw.likeCount.toString(), 10),
        commentCount: parseInt(raw.commentCount.toString(), 10),
        isActive: raw.isActive,
    };
}

/**
 * Hook para obtener el feed de actividad (comunidades con sus posts recientes)
 * Usa RPC público para lectura, wallet para membership
 */
export function useActivityFeed(postsPerCommunity: number = 5) {
    const { isConnected, provider, address } = useWalletContext();

    return useQuery({
        queryKey: ['activity', 'feed', address || 'anonymous'],
        queryFn: async (): Promise<CommunityWithPosts[]> => {
            // Use public provider for reading
            const readProvider = new JsonRpcProvider(ARBITRUM_RPC);
            const contract = new Contract(forumAddress, forumABI, readProvider);
            
            const rawCommunities = await contract.getActiveCommunities();

            const communitiesWithPosts = await Promise.all(
                rawCommunities.map(async (community: any) => {
                    const id = community.id.toString();

                    // Fetch community data from IPFS
                    const communityData = await fetchCommunityData(community.contentCID);
                    const name = communityData?.name || `Community #${id}`;
                    const description = communityData?.description || '';
                    const photo = communityData?.photo || '';

                    // Fetch member count, membership status, and posts in parallel
                    const [memberCountResult, isMemberResult, postsFromContract] = await Promise.all([
                        contract.getCommunityMemberCount(id).catch(() => 0),
                        isConnected && address
                            ? contract.isMember(id, address).catch(() => false)
                            : Promise.resolve(false),
                        contract.getCommunityPosts(id).catch(() => [])
                    ]);

                    const memberCount = parseInt(memberCountResult.toString(), 10);
                    const isMember = isMemberResult;
                    
                    // Filter active posts and take only recent ones
                    const activePosts = postsFromContract
                        .filter((post: any) => post.isActive)
                        .slice(0, postsPerCommunity);

                    // Parse posts in parallel
                    const posts = await Promise.all(
                        activePosts.map((post: any) => parsePost(post, id))
                    );

                    // Sort by timestamp (newest first)
                    posts.sort((a, b) => b.timestamp - a.timestamp);

                    // Only return communities with posts
                    if (posts.length === 0) return null;

                    return {
                        id,
                        name,
                        description,
                        postCount: parseInt(community.postCount.toString(), 10),
                        memberCount,
                        photo,
                        posts,
                        isMember,
                    } as CommunityWithPosts;
                })
            );

            // Filter out null communities and sort by most recent post
            const validCommunities = communitiesWithPosts.filter((c): c is CommunityWithPosts => c !== null);
            validCommunities.sort((a, b) => {
                const aLatest = a.posts[0]?.timestamp || 0;
                const bLatest = b.posts[0]?.timestamp || 0;
                return bLatest - aLatest;
            });

            return validCommunities;
        },
        staleTime: 2 * 60 * 1000, // 2 minutos
        gcTime: 5 * 60 * 1000, // 5 minutos
        refetchOnWindowFocus: false,
    });
}

/**
 * Hook para actualizar el estado de membership de una comunidad en el cache
 */
export function useUpdateCommunityMembership() {
    const queryClient = useQueryClient();
    const { address } = useWalletContext();

    return (communityId: string, isMember: boolean, memberCountDelta: number = 0) => {
        queryClient.setQueryData<CommunityWithPosts[]>(
            ['activity', 'feed', address || 'anonymous'],
            (old) => {
                if (!old) return old;
                return old.map((community) => {
                    if (community.id === communityId) {
                        return {
                            ...community,
                            isMember,
                            memberCount: community.memberCount + memberCountDelta,
                        };
                    }
                    return community;
                });
            }
        );
    };
}
