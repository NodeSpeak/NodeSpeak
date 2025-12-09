"use client";
import { WalletConnect } from '@/components/WalletConnect';
import { ThemeToggle } from '@/components/theme-toggle';
import { AdminFloatingButton } from '@/components/admin/AdminFloatingButton';
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from 'next/navigation';
import { ethers, Contract } from "ethers";
import { useWalletContext } from "@/contexts/WalletContext";
import { useCommunitySettings } from "@/contexts/CommunitySettingsContext";
import { forumAddress, forumABI } from "@/contracts/DecentralizedForum_V3.3";
import { IntegratedView } from '@/components/IntegratedView';
import siteConfig from '@/config';
import { fetchContent, uploadFile, uploadJSON, getImageUrl } from '@/lib/ipfsClient';

// Cache for community data and post content (local to component)
const communityDataCache = new Map();
const contentCache = new Map();

export default function Home() {
    const { isConnected, provider } = useWalletContext();
    const { setCommunityType } = useCommunitySettings();
    const searchParams = useSearchParams();
    const [creatingCommunity, setCreatingCommunity] = useState(false);
    const [joiningCommunityId, setJoiningCommunityId] = useState<string | null>(null);
    const [leavingCommunityId, setLeavingCommunityId] = useState<string | null>(null);

    // Updated interfaces
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

    interface Topic {
        id: number;
        name: string;
    }

    interface Community {
        id: string;
        name: string;
        description: string;
        topicCount: number;
        postCount: number;
        creator: string;
        isMember?: boolean;
        isCreator?: boolean;
        memberCount?: number;
        topics: string[];
        photo?: string;
        coverImage?: string;
    }

    const [posts, setPosts] = useState<Post[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [communities, setCommunities] = useState<Community[]>([]);
    const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
    const [isCreatingCommunity, setIsCreatingCommunity] = useState(false);
    const [showCommunityList, setShowCommunityList] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    // Helper function to fetch IPFS content - uses centralized ipfsClient
    const fetchFromIPFS = async (cid: any, useCache = true) => {
        if (!cid) return null;
        try {
            return await fetchContent(cid, { useCache });
        } catch (error) {
            console.error(`Failed to fetch content for CID ${cid}:`, error);
            return "Content unavailable";
        }
    };

    // Get communities from contract
    const fetchCommunities = async () => {
        if (isLoading) {
            return;
        }

        try {
            setIsLoading(true);

            if (!provider) {
                console.error("No provider found in wallet context.");
                return;
            }

            const contract = new Contract(forumAddress, forumABI, provider);
            const communitiesFromContract = await contract.getActiveCommunities();

            // Get current user address
            let userAddress = "";
            try {
                const signer = await provider.getSigner();
                userAddress = await signer.getAddress();
            } catch (err) {
                console.error("Error getting user address:", err);
            }

            const communityPromises = communitiesFromContract.map(async (community: any) => {
                const id = community.id.toString();
                let name = `Community #${id}`;
                let description = "No description available";
                let photo = "";
                let coverImage = "";

                // Use cache for community data
                const cacheKey = `community_${id}`;
                if (communityDataCache.has(cacheKey)) {
                    const cachedData = communityDataCache.get(cacheKey);
                    name = cachedData.name;
                    description = cachedData.description;
                    photo = cachedData.photo || "";
                    coverImage = cachedData.coverImage || "";
                } else {
                    try {
                        // Get community data from IPFS
                        const communityData = await fetchFromIPFS(community.contentCID);
                        if (communityData) {
                            name = communityData.name || name;
                            description = communityData.description || description;
                            photo = communityData.photo || "";
                            coverImage = communityData.coverImage || "";

                            console.log(`Community ${id} - Photo CID: ${photo}, Cover CID: ${coverImage}`);

                            // Cache the community data including images
                            communityDataCache.set(cacheKey, { name, description, photo, coverImage });
                        }
                    } catch (err) {
                        console.error(`Error getting data for community ${id}:`, err);
                    }
                }

                // Check if user is a member or the creator
                let isMember = false;
                let memberCount = 0;
                // Usar una función más robusta:
                const isAddressEqual = (addr1: string, addr2: string) => {
                    if (!addr1 || !addr2) {
                        return false;
                    }
                    return addr1.toLowerCase() === addr2.toLowerCase();
                };

                const isCreator = isAddressEqual(community.creator, userAddress);

                try {
                    if (userAddress) {
                        // Si el usuario es el creador, automáticamente es miembro
                        if (isCreator) {
                            isMember = true;
                        } else {
                            isMember = await contract.isMember(id, userAddress);
                        }
                        const count = await contract.getCommunityMemberCount(id);
                        memberCount = parseInt(count.toString(), 10);
                    }
                } catch (err) {
                    console.error(`Error checking membership for community ${id}:`, err);
                }

                // Get community topics
                let topicsList: string[] = [];
                try {
                    topicsList = await contract.getCommunityTopics(id);
                } catch (err) {
                    console.error(`Error getting topics for community ${id}:`, err);
                }

                // Dentro de fetchCommunities, añadir logs detallados:
                // console.log(`Community ${id} - Creator: ${community.creator}`);
                // console.log(`Current user: ${userAddress}`);
                // console.log(`Is creator: ${isCreator}`);
                // console.log(`Is member (from contract): ${await contract.isMember(id, userAddress)}`);

                return {
                    id,
                    name,
                    description,
                    topicCount: community.topics.length,
                    postCount: parseInt(community.postCount.toString(), 10),
                    creator: community.creator,
                    isMember,
                    isCreator,
                    memberCount,
                    topics: topicsList,
                    photo,
                    coverImage
                };
            });

            const parsedCommunities = await Promise.all(communityPromises);
            
            // Log communities with images for debugging
            console.log("Loaded communities:", parsedCommunities.map(c => ({
                id: c.id,
                name: c.name,
                hasPhoto: !!c.photo,
                hasCover: !!c.coverImage,
                photo: c.photo,
                coverImage: c.coverImage
            })));
            
            setCommunities(parsedCommunities);

            // Check if there's a community ID in the URL params
            const communityFromUrl = searchParams.get('community');
            
            // If no community is selected and communities are available
            if (!selectedCommunityId && parsedCommunities.length > 0) {
                // Prioritize community from URL if it exists and is valid
                if (communityFromUrl) {
                    const urlCommunity = parsedCommunities.find(c => c.id === communityFromUrl);
                    if (urlCommunity) {
                        setSelectedCommunityId(urlCommunity.id);
                        fetchPostsForCommunity(urlCommunity.id);
                        setShowCommunityList(false); // Hide community list to show posts
                        return;
                    }
                }
                // Otherwise select the first community
                setSelectedCommunityId(parsedCommunities[0].id);
                fetchPostsForCommunity(parsedCommunities[0].id);
            }

        } catch (error) {
            console.error("Error getting communities:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Get posts for a specific community
    const fetchPostsForCommunity = async (communityId: string) => {
        if (isLoading) {
            return;
        }
        try {
            setIsLoading(true);
            if (!provider) {
                console.error("No provider found in wallet context.");
                return;
            }
            const contract = new Contract(forumAddress, forumABI, provider);
            const postsFromContract = await contract.getCommunityPosts(communityId);

            // Filtrar solo los posts activos antes de procesarlos
            const activePosts = postsFromContract.filter((post: any) => {
                console.log('Post:', post);
                return post.isActive
            });

            console.log('Active posts:', activePosts);

            const postsParsed = await Promise.all(
                activePosts.map(async (post: any) => {
                    const id = parseInt(post.id.toString(), 10);
                    const { title } = post;
                    let content = "";
                    // Use cache for post content
                    const cacheKey = `post_${id}`;
                    if (contentCache.has(cacheKey)) {
                        content = contentCache.get(cacheKey);
                    } else {
                        try {
                            const postContent = await fetchFromIPFS(post.contentCID);
                            content = postContent || "";
                            contentCache.set(cacheKey, content);
                        } catch (err) {
                            console.error(`Error getting content for post ${id}`, err);
                        }
                    }
                    // Handle image URL with centralized ipfsClient
                    let imageUrl = undefined;
                    if (post.imageCID && post.imageCID !== "") {
                        imageUrl = getImageUrl(post.imageCID);
                    }
                    return {
                        id: id.toString(),
                        title,
                        content,
                        timestamp: parseInt(post.timestamp.toString(), 10),
                        author: post.author,
                        imageUrl,
                        cid: post.contentCID,
                        topic: post.topic,
                        communityId: post.communityId.toString(),
                        likeCount: parseInt(post.likeCount.toString(), 10),
                        commentCount: parseInt(post.commentCount.toString(), 10),
                        isActive: post.isActive // Añadir esta propiedad
                    };
                })
            );
            // Sort posts by timestamp (newest first)
            postsParsed.sort((a, b) => b.timestamp - a.timestamp);
            setPosts(postsParsed);
            // Update topics based on selected community
            const community = communities.find(c => c.id === communityId);
            if (community) {
                const newTopics = community.topics.map((name, index) => ({
                    id: index,
                    name
                }));
                setTopics(newTopics);
            }
        } catch (error) {
            console.error("Error fetching posts for community:", error);
        } finally {
            setIsLoading(false);
        }
    };


    // Original function modified for compatibility
    const fetchPostsFromContract = async () => {
        if (selectedCommunityId) {
            fetchPostsForCommunity(selectedCommunityId);
        }
    };

    // Join a community
    const handleJoinCommunity = async (communityId: string) => {
        if (!provider) {
            alert("No Ethereum provider connected.");
            return;
        }

        try {
            setJoiningCommunityId(communityId);

            const signer = await provider.getSigner();
            const contract = new Contract(forumAddress, forumABI, signer);

            // Verificar primero si ya es miembro
            const userAddress = await signer.getAddress();
            const isMember = await contract.isMember(communityId, userAddress);

            if (isMember) {
                console.log("You are already a member of this community.");

                // Actualizar el estado localmente sin hacer la transacción
                setCommunities(prev => prev.map(community => {
                    if (community.id === communityId) {
                        return { ...community, isMember: true };
                    }
                    return community;
                }));

                setJoiningCommunityId(null);
                return;
            }

            // Si no es miembro, proceder con la transacción
            const tx = await contract.joinCommunity(communityId);
            await tx.wait();

            // Update community list
            fetchCommunities();

            // Auto navigate to posts view if join was successful
            // Set timeout to give time for the state to update
            setTimeout(() => {
                setShowCommunityList(false);
            }, 1000);

        } catch (error: any) {
            console.error("Error joining community:", error);

            // Manejar el caso específico "Already a member"
            if (error.message && error.message.includes("Already a member")) {
                alert("You are already a member of this community.");

                // Actualizar el estado localmente
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

    // Leave a community
    const handleLeaveCommunity = async (communityId: string) => {
        if (!provider) {
            alert("No Ethereum provider connected.");
            return;
        }

        // Verificar si el usuario es el creador
        const community = communities.find(c => c.id === communityId);
        if (community?.isCreator) {
            alert("As the creator of this community, you cannot leave it.");
            return;
        }

        try {
            setLeavingCommunityId(communityId);

            const signer = await provider.getSigner();
            const contract = new Contract(forumAddress, forumABI, signer);

            const tx = await contract.leaveCommunity(communityId);
            await tx.wait();

            // Update community list
            fetchCommunities();
        } catch (error) {
            console.error("Error leaving community:", error);
            alert("Error leaving community. Check console.");
        } finally {
            setLeavingCommunityId(null);
        }
    };

    // Create a new community
const handleCreateCommunity = async (
    name: string,
    description: string,
    communityTopics: string[],
    photo?: File,
    coverImage?: File,
    isClosed: boolean = false
) => {
    if (!provider) {
        alert("No Ethereum provider connected.");
        return;
    }

    try {
        setCreatingCommunity(true);

        // Upload photo and cover image to IPFS if available
        let photoCID = "";
        let coverImageCID = "";

        // Upload photo and cover image in parallel for better performance
        const uploadPromises: Promise<void>[] = [];

        if (photo) {
            uploadPromises.push(
                uploadFile(photo, 'community-photo.jpg')
                    .then(cid => { photoCID = cid; })
                    .catch(error => console.error("Error uploading community photo:", error))
            );
        }

        if (coverImage) {
            uploadPromises.push(
                uploadFile(coverImage, 'community-cover.jpg')
                    .then(cid => { coverImageCID = cid; })
                    .catch(error => console.error("Error uploading community cover image:", error))
            );
        }

        // Wait for image uploads to complete
        await Promise.all(uploadPromises);

        // Upload community data to IPFS
        const communityData = {
            name,
            description,
            photo: photoCID,
            coverImage: coverImageCID
        };

        console.log("Community data to upload:", communityData);

        // Upload data to IPFS
        const contentCID = await uploadJSON(communityData, 'community-data.json');

        // Send transaction to contract
        const signer = await provider.getSigner();
        const contract = new Contract(forumAddress, forumABI, signer);
        
        try {
            // El contrato createCommunity espera: contentCID, initialTopics, profileCID, coverCID
            await contract.createCommunity.estimateGas(
                contentCID,
                communityTopics,
                photoCID,
                coverImageCID
            );

            const tx = await contract.createCommunity(
                contentCID,
                communityTopics,
                photoCID,
                coverImageCID
            );
            
            await tx.wait();

            // Get the new community ID from events or by fetching updated communities
            // For now, we'll get the latest community count and assume it's the new one
            const userAddress = await signer.getAddress();

            // Fetch communities to get the new community ID
            await fetchCommunities();

            // Get the latest community (the one just created)
            // The contract auto-increments community IDs, so the last one is the newest
            const communitiesData = await contract.getActiveCommunities();
            if (communitiesData.length > 0) {
                // Find the community created by this user (most recent one)
                const userCommunities = communitiesData.filter(
                    (c: any) => c.creator.toLowerCase() === userAddress.toLowerCase()
                );
                if (userCommunities.length > 0) {
                    // Get the highest ID community created by this user
                    const latestCommunity = userCommunities.reduce((max: any, c: any) =>
                        Number(c.id) > Number(max.id) ? c : max
                    );
                    // Save community type to localStorage
                    setCommunityType(latestCommunity.id.toString(), isClosed, userAddress);
                }
            }

            setIsCreatingCommunity(false);

            // Show success message
            alert(`Community created successfully! ${isClosed ? '(Closed community)' : '(Open community)'}`);
        } catch (error: any) {
            console.error("Transaction failed:", error);
            alert(`Failed to create community. ${error.message || ''}`);
        }
    } catch (error: any) {
        console.error("Error creating community:", error);
        alert(`Error creating community: ${error.message || 'Unknown error'}`);
    } finally {
        setCreatingCommunity(false);
    }
};

    useEffect(() => {
        const loadUserData = async () => {
            if (provider) {
                try {
                    const signer = await provider.getSigner();
                    const address = await signer.getAddress();
                    console.log("User address loaded:", address);

                    // Solo cargar comunidades después de tener la dirección confirmada
                    await fetchCommunities();
                } catch (err) {
                    console.error("Error getting user address:", err);
                }
            }
        };

        if (isConnected) {
            loadUserData();
        }
    }, [isConnected, provider]);

    // Handle community query parameter from URL
    useEffect(() => {
        const communityId = searchParams.get('community');
        if (communityId && communities.length > 0) {
            const community = communities.find(c => c.id === communityId);
            if (community && (community.isMember || community.isCreator)) {
                setSelectedCommunityId(communityId);
                setShowCommunityList(false);
                fetchPostsForCommunity(communityId);
            }
        }
    }, [searchParams, communities]);

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
                                className="text-slate-500 dark:text-slate-400 text-sm px-4 py-2 rounded-lg hover:bg-white/50 dark:hover:bg-slate-700/50 transition-colors inline-flex items-center gap-2"
                            >
                                ← Communities
                            </button>
                        </div>
                    )}
                </header>

                {isConnected && (
                    <main className="space-y-6">
                        {/* Loading indicator */}
                        {isLoading && (
                            <div className="text-center p-6">
                                <p className="text-slate-500 dark:text-slate-400 animate-pulse">Loading...</p>
                            </div>
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
                            creatingCommunity={creatingCommunity}
                            joiningCommunityId={joiningCommunityId}
                            leavingCommunityId={leavingCommunityId}
                            selectedCommunityId={selectedCommunityId}
                            setSelectedCommunityId={setSelectedCommunityId}
                            fetchPostsForCommunity={fetchPostsForCommunity}
                            showCommunityList={showCommunityList}
                            setShowCommunityList={setShowCommunityList}
                        />
                    </main>
                )}
            </div>
            <AdminFloatingButton />
        </div>
    );
}