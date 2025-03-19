"use client";
import { MatrixRain } from '@/components/MatrixRain';
import { WalletConnect } from '@/components/WalletConnect';
import { SystemStatus } from '@/components/SystemStatus';
import { useState, useEffect, useMemo } from "react";
import { ethers, Contract } from "ethers";
import { useWalletContext } from "@/contexts/WalletContext";
import axios from 'axios';
import { forumAddress, forumABI } from "@/contracts/DecentralizedForum_Commuties";
import { IntegratedView } from '@/components/IntegratedView';
import siteConfig from '@/config';


// Use a cached IPFS gateway to reduce rate limiting issues
const PINATA_GATEWAY = "https://ipfs.io/ipfs/";
// Add a backup gateway
const BACKUP_GATEWAY = "https://ipfs.io/ipfs/";

// Cache for content and community data
const contentCache = new Map();
const communityDataCache = new Map();

export default function Home() {
    const { isConnected, provider } = useWalletContext();
    const [creatingCommunity, setCreatingCommunity] = useState(false);
    const [joiningCommunityId, setJoiningCommunityId] = useState<string | null>(null);
    const [leavingCommunityId, setLeavingCommunityId] = useState<string | null>(null);

    // Updated interfaces
    interface Post {
        id: string;
        title: string;
        content: string;
        timestamp: number;
        address: string;
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
    }

    const [posts, setPosts] = useState<Post[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [communities, setCommunities] = useState<Community[]>([]);
    const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
    const [isCreatingCommunity, setIsCreatingCommunity] = useState(false);
    const [showCommunityList, setShowCommunityList] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    // Helper function to fetch IPFS content with caching and fallback
    const fetchFromIPFS = async (cid: any, useCache = true) => {
        if (!cid) return null;

        // Si ya está en caché, devolver el valor
        if (useCache && contentCache.has(cid)) {
            return contentCache.get(cid);
        }

        // Lista de gateways IPFS para probar
        const gateways = [
            PINATA_GATEWAY,
            BACKUP_GATEWAY,
            "https://ipfs.io/ipfs/",
            "https://cloudflare-ipfs.com/ipfs/",
            "https://dweb.link/ipfs/"
        ];

        // Intentar con cada gateway
        for (const gateway of gateways) {
            try {
                const response = await axios.get(`${gateway}${cid}`, {
                    timeout: 5000, // Timeout de 5 segundos
                    validateStatus: (status) => status === 200 // Solo aceptar 200 OK
                });

                const { data } = response;
                // Guardar en caché si se obtuvo correctamente
                contentCache.set(cid, data);
                return data;
            } catch (error) {
                // Si hay error, loguear y probar con la siguiente gateway
                if (error instanceof Error) {
                    console.warn(`Failed to fetch from ${gateway} for CID ${cid}:`, error.message || 'Unknown error');
                } else {
                    console.warn(`Failed to fetch from ${gateway} for CID ${cid}: Unknown error`);
                }
                // Continuar al siguiente gateway
            }
        }

        // Si todos los intentos fallan, devolver un valor por defecto
        console.error(`Failed to fetch content for CID ${cid} from all gateways`);

        // Cachear un valor por defecto para evitar intentos repetidos
        const defaultContent = "Content unavailable";
        contentCache.set(cid, defaultContent);
        return defaultContent;
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

                // Use cache for community data
                const cacheKey = `community_${id}`;
                if (communityDataCache.has(cacheKey)) {
                    const cachedData = communityDataCache.get(cacheKey);
                    name = cachedData.name;
                    description = cachedData.description;
                } else {
                    try {
                        // Get community data from IPFS
                        const communityData = await fetchFromIPFS(community.contentCID);
                        if (communityData) {
                            name = communityData.name || name;
                            description = communityData.description || description;

                            // Cache the community data
                            communityDataCache.set(cacheKey, { name, description });
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
                    topics: topicsList
                };
            });

            const parsedCommunities = await Promise.all(communityPromises);
            setCommunities(parsedCommunities);

            // If no community is selected and communities are available, select the first one
            if (!selectedCommunityId && parsedCommunities.length > 0) {
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
                    // Handle image URL with proper gateway
                    let imageUrl = undefined;
                    if (post.imageCID && post.imageCID !== "") {
                        imageUrl = `${BACKUP_GATEWAY}${post.imageCID}`;
                    }
                    return {
                        id: id.toString(),
                        title,
                        content,
                        timestamp: parseInt(post.timestamp.toString(), 10),
                        address: post.author,
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

    // Upload community data to Pinata
    const uploadToIPFS = async (file: File | string) => {
        try {
            const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";
            const formData = new FormData();
            if (typeof file === 'string') {
                const blob = new Blob([file], { type: 'application/json' });
                formData.append("file", blob);
            } else {
                formData.append("file", file);
            }

            const pinataMetadata = JSON.stringify({ name: "community-data" });
            formData.append("pinataMetadata", pinataMetadata);

            const res = await axios.post(url, formData, {
                maxBodyLength: Infinity,
                headers: {
                    "Content-Type": "multipart/form-data",
                    pinata_api_key: "f8f064ba07b90906907d",
                    pinata_secret_api_key: "4cf373c7ce0a77b1e7c26bcbc0ba2996cde5f3b508522459e7ff46afa507be08",
                }
            });

            return res.data;
        } catch (err) {
            console.error("Error uploading community data to Pinata:", err);
            throw err;
        }
    };

    // Create a new community
    const handleCreateCommunity = async (
        name: string, 
        description: string, 
        communityTopics: string[],
        photo?: File,
        coverImage?: File
    ) => {
        if (!provider) {
            alert("No Ethereum provider connected.");
            return;
        }

        try {
            setCreatingCommunity(true);

            // Upload photo and cover image to IPFS if available
            let photoCID = null;
            let coverImageCID = null;

            if (photo) {
                try {
                    const photoResult = await uploadToIPFS(photo);
                    photoCID = photoResult.IpfsHash;
                } catch (error) {
                    console.error("Error uploading community photo:", error);
                }
            }

            if (coverImage) {
                try {
                    const coverResult = await uploadToIPFS(coverImage);
                    coverImageCID = coverResult.IpfsHash;
                } catch (error) {
                    console.error("Error uploading community cover image:", error);
                }
            }

            // Upload community data to IPFS
            const communityData = {
                name,
                description,
                photo: photoCID,
                coverImage: coverImageCID
            };

            // Upload data to IPFS
            const contentCID = await uploadToIPFS(JSON.stringify(communityData));

            // Send transaction to contract
            const signer = await provider.getSigner();
            const contract = new Contract(forumAddress, forumABI, signer);
            // First, check if we can estimate the gas for this transaction
            try {
                // Estimate gas before attempting the transaction
                await contract.createCommunity.estimateGas(contentCID.IpfsHash, communityTopics);

                // If estimation succeeds, proceed with the transaction
                const tx = await contract.createCommunity(contentCID.IpfsHash, communityTopics);
                await tx.wait();

                // Update communities
                await fetchCommunities();
                setIsCreatingCommunity(false);
                
                // Show success message
                alert('Community created successfully!');
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

    return (
        <div className="min-h-screen relative">
            <MatrixRain />
            <div className="container mx-auto p-4 relative z-10">
                <header className="mb-8">
                    <div className="flex justify-between items-start">
                        <h1 className="text-2xl font-mono">{siteConfig.name}</h1>
                        <div className="flex flex-col items-end space-y-2">
                            <WalletConnect />
                            <SystemStatus />
                        </div>
                    </div>
                </header>

                {isConnected && (
                    <main className="space-y-6">
                        {/* Navigation between communities and creation */}
                        {/* <div className="flex justify-between items-center">
                            <div className="flex space-x-4">
                                <Button
                                    onClick={() => setShowCommunityList(true)}
                                    className={`text-xs py-1 px-2 h-auto ${showCommunityList
                                        ? 'bg-[var(--matrix-green)] text-black'
                                        : 'bg-transparent border border-[var(--matrix-green)] text-[var(--matrix-green)] hover:bg-[rgba(0,255,0,0.1)]'}`}
                                >
                                    Communities
                                </Button>
                                <Button
                                    onClick={() => setShowCommunityList(false)}
                                    className={`text-xs py-1 px-2 h-auto ${!showCommunityList
                                        ? 'bg-[var(--matrix-green)] text-black'
                                        : 'bg-transparent border border-[var(--matrix-green)] text-[var(--matrix-green)] hover:bg-[rgba(0,255,0,0.1)]'}`}
                                >
                                    Posts
                                </Button>
                            </div>

                            {showCommunityList ? (
                                <Button
                                    onClick={() => setIsCreatingCommunity(!isCreatingCommunity)}
                                    className="text-xs py-1 px-2 h-auto bg-transparent border border-[var(--matrix-green)] text-[var(--matrix-green)] hover:bg-[rgba(0,255,0,0.1)]"
                                    disabled={isLoading || creatingCommunity}
                                >
                                    {isCreatingCommunity ? "Cancel" : "Create Community"}
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => setIsCreating(!isCreating)}
                                    className="text-xs py-1 px-2 h-auto bg-transparent border border-[var(--matrix-green)] text-[var(--matrix-green)] hover:bg-[rgba(0,255,0,0.1)]"
                                    disabled={!selectedCommunityId || isLoading}
                                >
                                    {isCreating ? "Cancel" : "Create Post"}
                                </Button>
                            )}
                        </div> */}

                        {/* Loading indicator */}
                        {isLoading && (
                            <div className="text-center p-4">
                                <p className="text-[var(--matrix-green)] animate-pulse">Loading...</p>
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
                        />
                    </main>
                )}
            </div>
        </div>
    );
}