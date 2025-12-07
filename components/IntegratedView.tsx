"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Contract } from "ethers";
import { useWalletContext } from "@/contexts/WalletContext";
import { useAdminContext } from "@/contexts/AdminContext";
import { ImagePlus, Send } from "lucide-react";
import DOMPurify from 'dompurify';
import { TopicsDropdown } from "@/components/TopicsDropdown";
import axios from "axios";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Code from '@tiptap/extension-code';
import Link from '@tiptap/extension-link';
import { UserAvatar } from "@/components/UserAvatar";
import { CoverImageEditor } from "@/components/CoverImageEditor";

// Types
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

interface Post {
    id: string;
    content: string;
    timestamp: number;
    topic: string;
    imageUrl?: string;
    communityId: string;
    title: string;
    likeCount: number;
    commentCount: number;
    isActive: boolean;
    author?: string;
}

interface Comment {
    id: string;
    postId: string;
    author: string;
    content: string;
    timestamp: number;
    isActive: boolean;
    likeCount?: number;
}

interface Topic {
    id: number;
    name: string;
}

interface IntegratedViewProps {
    communities: Community[];
    posts: Post[];
    fetchPostsFromContract: () => Promise<void>;
    forumAddress: string;
    forumABI: any;
    provider: any;
    isCreatingCommunity: boolean;
    setIsCreatingCommunity: (value: boolean) => void;
    handleCreateCommunity: (name: string, description: string, topics: string[], photo?: File, cover?: File) => Promise<void>;
    handleJoinCommunity: (communityId: string) => Promise<void>;
    handleLeaveCommunity: (communityId: string) => Promise<void>;
    isLoading: boolean;
    creatingCommunity: boolean;
    joiningCommunityId: string | null;
    leavingCommunityId: string | null;
    refreshCommunities?: () => Promise<void>;
    fetchPostsForCommunity?: (communityId: string) => Promise<void>;
    isCreatingPost?: boolean;
    setIsCreatingPost?: (value: boolean) => void;
    setIsCreating?: (value: boolean) => void;
    selectedCommunityId?: string | null;
    setSelectedCommunityId?: (communityId: string | null) => void;
    showCommunityList?: boolean;
    setShowCommunityList?: (value: boolean) => void;
}

// Rich Text Editor Component for Create Post
const MatrixEditor = ({ content, setContent }: { content: string; setContent: React.Dispatch<React.SetStateAction<string>> }) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Bold,
            Italic,
            Code,
            Link.configure({
                openOnClick: false,
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            setContent(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'bg-white border border-slate-200 text-slate-900 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 min-h-[150px] prose prose-sm max-w-none',
            },
        },
    });

    if (!editor) {
        return null;
    }

    return (
        <div className="rich-editor">
            <div className="flex gap-2 mb-2 flex-wrap">
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`px-3 py-1.5 text-xs border rounded-lg transition-colors ${editor.isActive('bold') ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                >
                    Bold
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`px-3 py-1.5 text-xs border rounded-lg transition-colors ${editor.isActive('italic') ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                >
                    Italic
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    className={`px-3 py-1.5 text-xs border rounded-lg transition-colors ${editor.isActive('code') ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                >
                    Code
                </button>
                <button
                    onClick={() => {
                        const url = window.prompt('URL');
                        if (url) {
                            editor.chain().focus().setLink({ href: url }).run();
                        }
                    }}
                    className={`px-3 py-1.5 text-xs border rounded-lg transition-colors ${editor.isActive('link') ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                >
                    Link
                </button>
                <button
                    onClick={() => editor.chain().focus().unsetLink().run()}
                    className="px-3 py-1.5 text-xs border rounded-lg transition-colors bg-white text-slate-700 border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                    disabled={!editor.isActive('link')}
                >
                    Unlink
                </button>
            </div>
            <EditorContent editor={editor} />
        </div>
    );
};

// Formatted Content Component
const FormattedContent = ({ htmlContent }: { htmlContent: string }) => {
    const sanitizedHtml = useMemo(() => {
        return DOMPurify.sanitize(htmlContent);
    }, [htmlContent]);

    return (
        <div
            className="post-content prose prose-sm max-w-none text-slate-700"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
    );
};

export const IntegratedView = ({
    communities,
    posts,
    fetchPostsFromContract,
    forumAddress,
    forumABI,
    provider,
    isCreatingCommunity,
    setIsCreatingCommunity,
    handleCreateCommunity,
    handleJoinCommunity,
    handleLeaveCommunity,
    isLoading,
    creatingCommunity,
    joiningCommunityId,
    leavingCommunityId,
    refreshCommunities,
    fetchPostsForCommunity,
    isCreatingPost: externalIsCreatingPost,
    setIsCreatingPost: externalSetIsCreatingPost,
    setIsCreating: externalSetIsCreating,
    selectedCommunityId: externalSelectedCommunityId,
    setSelectedCommunityId: externalSetSelectedCommunityId,
    showCommunityList: externalShowCommunityList,
    setShowCommunityList: externalSetShowCommunityList
}: IntegratedViewProps) => {
    const { isConnected, provider: walletProvider } = useWalletContext();
    const { isUserHidden, isCommunityHidden } = useAdminContext();

    // State for both components
    const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
    const [internalShowCommunityList, setInternalShowCommunityList] = useState(true);
    const showCommunityList = externalShowCommunityList !== undefined ? externalShowCommunityList : internalShowCommunityList;
    const setShowCommunityList = externalSetShowCommunityList || setInternalShowCommunityList;
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [localCommunities, setLocalCommunities] = useState<Community[]>(communities);

    // Posts states
    const [hasLoaded, setHasLoaded] = useState(false);
    const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
    const [comments, setComments] = useState<Record<string, Comment[]>>({});
    const [newCommentText, setNewCommentText] = useState<Record<string, string>>({});
    const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
    const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});
    const [likingPost, setLikingPost] = useState<Record<string, boolean>>({});
    const [userLikedPosts, setUserLikedPosts] = useState<Record<string, boolean>>({});

    // Communities states
    const [newTopic, setNewTopic] = useState("");
    const [isSubmittingTopic, setIsSubmittingTopic] = useState(false);
    const [topicError, setTopicError] = useState("");
    const [showAddTopicForm, setShowAddTopicForm] = useState<Record<string, boolean>>({});

    // CreatePost states - use external state if provided, otherwise use internal state
    const [internalIsCreatingPost, setInternalIsCreatingPost] = useState(false);
    const isCreatingPost = externalIsCreatingPost !== undefined ? externalIsCreatingPost : internalIsCreatingPost;
    const setIsCreatingPost = externalSetIsCreatingPost || setInternalIsCreatingPost;

    const [newPost, setNewPost] = useState("<p>Write your post here...</p>");
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [communityTopics, setCommunityTopics] = useState<Topic[]>([]);
    const [postSelectedTopic, setPostSelectedTopic] = useState<string>("");

    const topicInputRef = useRef<HTMLInputElement>(null);

    // Community cover editor states
    const [showCommunityCoverEditor, setShowCommunityCoverEditor] = useState(false);
    const [tempCommunityCoverImage, setTempCommunityCoverImage] = useState<string>("");
    const [communityCoverFile, setCommunityCoverFile] = useState<File | null>(null);
    const [communityCoverPreview, setCommunityCoverPreview] = useState<string>("");

    // Community logo editor states
    const [showCommunityLogoEditor, setShowCommunityLogoEditor] = useState(false);
    const [tempCommunityLogoImage, setTempCommunityLogoImage] = useState<string>("");
    const [communityLogoFile, setCommunityLogoFile] = useState<File | null>(null);
    const [communityLogoPreview, setCommunityLogoPreview] = useState<string>("");

    // Update local communities when prop changes
    useEffect(() => {
        setLocalCommunities(communities);
    }, [communities]);

    useEffect(() => {
        // Solo ejecutar si existe un ID de comunidad seleccionada y ha cambiado
        if (selectedCommunityId) {
            // Usar un flag para evitar múltiples cargas
            const loadPosts = async () => {
                if (fetchPostsForCommunity) {
                    await fetchPostsForCommunity(selectedCommunityId);
                } else if (fetchPostsFromContract) {
                    await fetchPostsFromContract();
                }
            };

            loadPosts();
        }
        // La dependencia es solo selectedCommunityId, eliminamos las otras para evitar ciclos
    }, [selectedCommunityId]);

    // Load posts on initial render
    useEffect(() => {
        // Solo cargar si no hay comunidad seleccionada y no se han cargado posts todavía
        if (!hasLoaded && !selectedCommunityId) {
            fetchPostsFromContract()
                .then(() => {
                    setHasLoaded(true);
                })
                .catch((error) => {
                    console.error("Error fetching posts:", error);
                    setHasLoaded(true);
                });
        }
    }, [hasLoaded, fetchPostsFromContract, selectedCommunityId]);

    // Actualizar los tópicos disponibles cuando cambia la comunidad seleccionada para CreatePost
    useEffect(() => {
        if (selectedCommunityId) {
            // Primero buscar en localCommunities (que tiene las actualizaciones más recientes)
            let community = localCommunities.find(c => c.id === selectedCommunityId);

            // Si no se encuentra en localCommunities, buscar en communities (prop)
            if (!community) {
                community = communities.find(c => c.id === selectedCommunityId);
            }

            if (community) {
                const availableTopics = community.topics.map((name, index) => ({
                    id: index,
                    name
                }));

                setCommunityTopics(availableTopics);
                console.log(`Updated ${availableTopics.length} topics for selected community ${selectedCommunityId}`);
            }
        } else {
            // Limpiar los topics si no hay comunidad seleccionada
            setCommunityTopics([]);
        }
    }, [selectedCommunityId, communities, localCommunities]);


    useEffect(() => {
        if (isCreatingPost) {
            setNewPost("<p>Write your post here...</p>");
            setSelectedImage(null);
            setPostSelectedTopic("");
        }
    }, [isCreatingPost]);

    // Check which posts the current user has liked
    useEffect(() => {
        const checkUserLikes = async () => {
            if (!isConnected || !walletProvider || !posts.length) return;
            
            try {
                const signer = await walletProvider.getSigner();
                const userAddress = await signer.getAddress();
                
                // ABI for postLikes mapping (public mapping generates getter)
                const postManagerABI = [
                    {
                        "inputs": [
                            { "internalType": "uint32", "name": "", "type": "uint32" },
                            { "internalType": "address", "name": "", "type": "address" }
                        ],
                        "name": "postLikes",
                        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
                        "stateMutability": "view",
                        "type": "function"
                    }
                ];
                
                // Get postManager address from main contract
                const mainContract = new Contract(forumAddress, forumABI, walletProvider);
                const postManagerAddress = await mainContract.postManager();
                const postManager = new Contract(postManagerAddress, postManagerABI, walletProvider);
                
                // Check likes for all visible posts
                const likeStatus: Record<string, boolean> = {};
                for (const post of posts) {
                    try {
                        const hasLiked = await postManager.postLikes(post.id, userAddress);
                        likeStatus[post.id] = hasLiked;
                    } catch (e) {
                        likeStatus[post.id] = false;
                    }
                }
                
                setUserLikedPosts(likeStatus);
            } catch (error) {
                console.error("Error checking user likes:", error);
            }
        };
        
        checkUserLikes();
    }, [isConnected, walletProvider, posts, forumAddress, forumABI]);

    // CreatePost functions
    const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedImage(file);
        }
    };

    const handleTopicChange = (topic: string) => {
        setPostSelectedTopic(topic);
    };

    const handleCommunityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const communityId = e.target.value;

        // Actualizar el ID de comunidad seleccionada
        setSelectedCommunityId(communityId);

        // Resetear el topic seleccionado
        setPostSelectedTopic("");

        // Cargar inmediatamente los topics actualizados de la comunidad
        if (communityId) {
            const selectedCommunity = communities.find(c => c.id === communityId);
            if (selectedCommunity) {
                const availableTopics = selectedCommunity.topics.map((name, index) => ({
                    id: index,
                    name
                }));
                setCommunityTopics(availableTopics);
                console.log(`Loaded ${availableTopics.length} topics for community ${communityId}`);
            }
        } else {
            // Si no hay comunidad seleccionada, limpiar los topics
            setCommunityTopics([]);
        }
    };

    async function pinFileToIPFS(file: File) {
        try {
            const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";
            const formData = new FormData();
            formData.append("file", file);

            const pinataMetadata = JSON.stringify({ name: file.name || "uploaded-file" });
            formData.append("pinataMetadata", pinataMetadata);

            const res = await axios.post(url, formData, {
                maxBodyLength: Infinity,
                headers: {
                    "Content-Type": "multipart/form-data",
                    pinata_api_key: "f8f064ba07b90906907d",
                    pinata_secret_api_key: "4cf373c7ce0a77b1e7c26bcbc0ba2996cde5f3b508522459e7ff46afa507be08",
                },
            });

            return res.data.IpfsHash as string;
        } catch (err) {
            console.error("Error uploading file to Pinata:", err);
            throw err;
        }
    }

    const handleCreatePost = async (communityId: string, imageCID: string | null, textCID: string, topic: string, title: string) => {
        if (!provider) {
            alert("No Ethereum provider connected.");
            return;
        }
        try {
            const signer = await provider.getSigner();
            const contract = new Contract(forumAddress, forumABI, signer);
            // First, check if the user is a member of the community
            try {
                const userAddress = await signer.getAddress();
                // Verify if the user is the creator or member
                const community = communities.find(c => c.id === communityId);
                const isCreatorOrMember = community?.isCreator || community?.isMember;

                // If there's no info in the state, verify directly in the contract
                if (!isCreatorOrMember) {
                    const isMember = await contract.isMember(communityId, userAddress);
                    if (!isMember) {
                        alert("You must be a member of this community to create a post. Please join the community first.");
                        return;
                    }
                }

                // Attempt to estimate gas first to catch potential errors
                await contract.createPost.estimateGas(
                    communityId,
                    title, // Post title
                    textCID,
                    imageCID ?? "",
                    topic
                );

                // If estimation succeeds, proceed with the transaction
                const tx = await contract.createPost(
                    communityId,
                    title,
                    textCID,
                    imageCID ?? "",
                    topic
                );

                await tx.wait();

                // Refresh posts for the community
                if (fetchPostsForCommunity) {
                    fetchPostsForCommunity(communityId);
                } else {
                    fetchPostsFromContract();
                }

                return true; // Indicamos que la transacción fue exitosa
            } catch (estimateError: any) {
                console.error("Gas estimation error:", estimateError);
                if (estimateError.message) {
                    alert(`Cannot create post: ${estimateError.message}`);
                } else {
                    alert("Error creating post. The transaction would fail.");
                }
                return false; // Indicamos que la transacción falló
            }
        } catch (error: any) {
            console.error("Error sending post to contract:", error);
            // Try to provide a more specific error message
            let errorMessage = "Error creating post. Check the console for details.";
            if (error.message) {
                // Check if there's a specific contract error we can display
                if (error.message.includes("not a member")) {
                    errorMessage = "You must be a member of this community to create a post.";
                } else if (error.message.includes("cooldown")) {
                    errorMessage = "Please wait before creating another post. Cooldown period is active.";
                }
            }
            alert(errorMessage);
            return false; // Indicamos que la transacción falló
        }
    };

    const handleSubmitPost = async () => {
        // Validate content
        const tempElement = document.createElement('div');
        tempElement.innerHTML = newPost;
        const textContent = tempElement.textContent || tempElement.innerText || '';

        if (!textContent.trim()) {
            alert("Enter content for your post");
            return;
        }
        if (!postSelectedTopic) {
            alert("Select a topic");
            return;
        }
        if (!selectedCommunityId) {
            alert("Select a community");
            return;
        }

        setLoading(true);
        try {
            // Check if the topic exists in the community
            const community = localCommunities.find(c => c.id === selectedCommunityId);
            const topicExists = community?.topics.includes(postSelectedTopic);

            // If topic doesn't exist, add it to the blockchain first
            if (!topicExists && walletProvider) {
                console.log(`Topic "${postSelectedTopic}" not found in community. Adding it first...`);
                try {
                    const signer = await walletProvider.getSigner();
                    const contract = new Contract(forumAddress, forumABI, signer);
                    
                    console.log("Adding topic to blockchain...");
                    const tx = await contract.addTopicToCommunity(selectedCommunityId, postSelectedTopic);
                    console.log("Adding topic transaction submitted:", tx.hash);
                    await tx.wait();
                    console.log("Topic added successfully to blockchain");

                    // Update local state
                    setLocalCommunities(prevCommunities => 
                        prevCommunities.map(c => {
                            if (c.id === selectedCommunityId) {
                                return {
                                    ...c,
                                    topics: [...c.topics, postSelectedTopic],
                                    topicCount: c.topicCount + 1
                                };
                            }
                            return c;
                        })
                    );

                    // Refresh communities if available
                    if (refreshCommunities) {
                        await refreshCommunities();
                    }
                } catch (topicError: any) {
                    console.error("Error adding topic:", topicError);
                    let errorMessage = "Failed to add new topic to community";
                    if (topicError.message?.includes("Only the community creator")) {
                        errorMessage = "Only the community creator can add new topics. Please select an existing topic or ask the creator to add it.";
                    } else if (topicError.message?.includes("user rejected")) {
                        errorMessage = "Transaction was rejected by user";
                    }
                    alert(errorMessage);
                    setLoading(false);
                    return;
                }
            }

            let imageCid: string | null = null;

            if (selectedImage) {
                console.log("Uploading image to Pinata...");
                imageCid = await pinFileToIPFS(selectedImage);
                console.log("Image uploaded with CID:", imageCid);
            }

            console.log("Uploading text to Pinata...");
            const textBlob = new Blob([newPost], { type: "text/html" });
            const textFile = new File([textBlob], "post.html", { type: "text/html" });
            const textCid = await pinFileToIPFS(textFile);
            console.log("Text uploaded with CID:", textCid);

            // Utilizamos el valor de retorno para saber si fue exitoso
            const success = await handleCreatePost(selectedCommunityId, imageCid, textCid, postSelectedTopic, "No title");

            if (success) {
                // Limpiar todos los campos después de una transacción exitosa
                setNewPost("<p>Write your post here...</p>");
                setSelectedImage(null);
                setPostSelectedTopic("");
                setIsCreatingPost(false);
            }
        } catch (error) {
            console.error("Error in upload process:", error);
            alert("Error uploading files to Pinata.");
        } finally {
            setLoading(false);
        }
    };

    // Filter posts based on selected community and topic
    const filteredPosts = useMemo(() => {
        // Primero filtrar posts por usuarios y comunidades ocultas
        const visiblePosts = posts.filter(post => {
            // Si el autor está oculto, filtrar el post
            if (post.author && isUserHidden(post.author)) return false;
            
            // Si la comunidad está oculta, filtrar el post
            if (isCommunityHidden(post.communityId)) return false;
            
            return true;
        });

        // Si hay una comunidad seleccionada específicamente, mostrar solo sus posts
        if (selectedCommunityId) {
            return visiblePosts.filter(post =>
                post.communityId === selectedCommunityId &&
                (selectedTopic ? post.topic === selectedTopic : true)
            );
        }

        // Si no hay comunidad seleccionada, mostrar posts de comunidades donde el usuario es miembro
        const userCommunities = localCommunities
            .filter(c => (c.isMember || c.isCreator) && !isCommunityHidden(c.id))
            .map(c => c.id);

        return visiblePosts.filter((post) => {
            const matchesCommunity = userCommunities.includes(post.communityId);
            const matchesTopic = selectedTopic ? post.topic === selectedTopic : true;
            return matchesCommunity && matchesTopic;
        });
    }, [posts, selectedCommunityId, selectedTopic, localCommunities, isUserHidden, isCommunityHidden]);

    // Get all available topics from current posts 
    const availableTopics = useMemo(() => {
        const topicSet = new Set<string>();

        // If a community is selected, use its topics
        if (selectedCommunityId) {
            const selectedCommunity = localCommunities.find(c => c.id === selectedCommunityId);
            if (selectedCommunity) {
                selectedCommunity.topics.forEach(topic => topicSet.add(topic));
            }
        } else {
            // Otherwise collect all topics from posts
            posts.forEach(post => {
                if (post.topic) topicSet.add(post.topic);
            });
        }

        return Array.from(topicSet);
    }, [posts, selectedCommunityId, localCommunities]);

    // Handle community selection
    const handleSelectCommunity = (communityId: string) => {
        setSelectedCommunityId(communityId);
        setSelectedTopic(null); // Reset topic filter when changing community
        setShowCommunityList(false); // Show posts view
    };

    // Toggle between communities and posts view
    const toggleView = () => {
        setShowCommunityList(!showCommunityList);
    };

    // Function to handle adding a new topic
    const handleAddTopic = async (communityId: string, e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!newTopic.trim()) {
            setTopicError("Topic name cannot be empty");
            return;
        }

        if (!isConnected || !walletProvider) {
            setTopicError("Please connect your wallet to add a topic");
            return;
        }

        try {
            setIsSubmittingTopic(true);
            setTopicError("");

            const signer = await walletProvider.getSigner();
            const contract = new Contract(forumAddress, forumABI, signer);

            const tx = await contract.addTopicToCommunity(communityId, newTopic);
            console.log("Add topic transaction submitted:", tx.hash);

            const receipt = await tx.wait();
            console.log("Add topic transaction confirmed:", receipt);

            // Update localCommunities first
            setLocalCommunities(prevCommunities => {
                const updatedCommunities = prevCommunities.map(community => {
                    if (community.id === communityId) {
                        return {
                            ...community,
                            topics: [...community.topics, newTopic],
                            topicCount: community.topicCount + 1
                        };
                    }
                    return community;
                });

                // Actualizar también communityTopics si el ID de comunidad actual coincide
                if (selectedCommunityId === communityId) {
                    const currentCommunity = updatedCommunities.find(c => c.id === communityId);
                    if (currentCommunity) {
                        // Actualizar los tópicos disponibles con los topics actualizados
                        setCommunityTopics(currentCommunity.topics.map((name, index) => ({
                            id: index,
                            name
                        })));
                    }
                }

                return updatedCommunities;
            });

            // Clean up
            setNewTopic("");
            setShowAddTopicForm(prev => ({
                ...prev,
                [communityId]: false
            }));

            // Opcional: mostrar algún mensaje de éxito
            console.log(`Topic "${newTopic}" added successfully to community ${communityId}`);

            // Refresh from backend if available
            if (refreshCommunities) {
                await refreshCommunities();
            }

        } catch (error) {
            console.error("Error adding topic:", error);
            setTopicError(`Failed to add topic: ${error instanceof Error ? error.message : "Unknown error"}`);
        } finally {
            setIsSubmittingTopic(false);
        }
    };

    // Toggle add topic form visibility
    const toggleAddTopicForm = (communityId: string, e: React.MouseEvent) => {
        e.stopPropagation();

        // Alternar el estado del formulario
        setShowAddTopicForm(prev => {
            const newState = {
                ...prev,
                [communityId]: !prev[communityId]
            };

            // Si estamos abriendo el formulario, programar el foco para después del render
            if (newState[communityId]) {
                // Usar setTimeout para asegurar que el input esté renderizado
                setTimeout(() => {
                    if (topicInputRef.current) {
                        topicInputRef.current.focus();
                    }
                }, 50);
            }

            return newState;
        });

        setNewTopic("");
        setTopicError("");
    };

    // Quick add topic with prompt - generates transaction directly
    const handleQuickAddTopic = async (communityId: string) => {
        if (!isConnected || !walletProvider) {
            alert("Please connect your wallet to add a topic");
            return;
        }

        const topicName = window.prompt("Enter the name for the new topic:");
        if (!topicName || !topicName.trim()) {
            return; // User cancelled or entered empty string
        }

        try {
            setIsSubmittingTopic(true);

            const signer = await walletProvider.getSigner();
            const contract = new Contract(forumAddress, forumABI, signer);

            const tx = await contract.addTopicToCommunity(communityId, topicName.trim());
            console.log("Add topic transaction submitted:", tx.hash);

            const receipt = await tx.wait();
            console.log("Add topic transaction confirmed:", receipt);

            // Update localCommunities
            setLocalCommunities(prevCommunities => {
                return prevCommunities.map(community => {
                    if (community.id === communityId) {
                        return {
                            ...community,
                            topics: [...community.topics, topicName.trim()],
                            topicCount: community.topicCount + 1
                        };
                    }
                    return community;
                });
            });

            // Refresh communities from contract
            if (refreshCommunities) {
                await refreshCommunities();
            }

            alert(`Topic "${topicName.trim()}" added successfully!`);
        } catch (error: any) {
            console.error("Error adding topic:", error);
            if (error.message?.includes("Only the community creator")) {
                alert("Only the community creator can add new topics.");
            } else if (error.message?.includes("user rejected")) {
                // User cancelled transaction, no alert needed
            } else {
                alert(`Failed to add topic: ${error.message || "Unknown error"}`);
            }
        } finally {
            setIsSubmittingTopic(false);
        }
    };

    // Community related functions
    const handleCommunityClick = (community: Community) => {
        // Primero cambiar a la vista de posts si el usuario es miembro
        if (community.isMember || community.isCreator) {
            setShowCommunityList(false);
        }

        // Luego actualizar el ID de comunidad seleccionada
        // Esto activará el useEffect que cargará los posts
        setSelectedCommunityId(community.id);
        setSelectedTopic(null); // Reset topic filter

        // Ya no llamamos explícitamente a fetchPostsForCommunity o fetchPostsFromContract aquí
        // porque el useEffect se encargará de eso cuando cambie selectedCommunityId
    };

    // Handle topic pill click in the community list
    const handleTopicClick = (e: React.MouseEvent, topic: string) => {
        e.stopPropagation(); // Prevent community selection
        setSelectedTopic(topic);

        // If user is a member of any community, navigate to posts view
        const userIsMember = localCommunities.some(c => c.isMember || c.isCreator);
        if (userIsMember) {
            setShowCommunityList(false);
        }
    };

    // Post/Comment related functions
    const toggleComments = async (postId: string) => {
        console.log(`Toggling comments for post ${postId}`);

        // Si los comentarios ya están expandidos, solo alternar visibilidad
        if (expandedComments[postId]) {
            console.log(`Comments already loaded for post ${postId}, toggling visibility`);
            setExpandedComments(prev => ({
                ...prev,
                [postId]: !prev[postId]
            }));
            return;
        }

        console.log(`Loading comments for post ${postId} for the first time`);

        // Si los comentarios no están cargados o expandidos, cargarlos
        try {
            // Cargar los comentarios
            await fetchCommentsForPost(postId);

            // Establecer como expandidos
            setExpandedComments(prev => ({
                ...prev,
                [postId]: true
            }));

            // Refrescar los posts si es necesario para actualizar el contador de comentarios
            const post = posts.find(p => p.id === postId);
            if (post && comments[postId] && post.commentCount !== comments[postId].length) {
                console.log(`Comment count mismatch for post ${postId}. Refreshing posts...`);

                if (selectedCommunityId && fetchPostsForCommunity) {
                    await fetchPostsForCommunity(selectedCommunityId);
                } else {
                    await fetchPostsFromContract();
                }
            }
        } catch (error) {
            console.error(`Error toggling comments for post ${postId}:`, error);
        }
    };

    const fetchCommentsForPost = async (postId: string) => {
        console.log(`Fetching comments for post ${postId}`);

        // Verificar si ya estamos cargando comentarios para este post
        if (loadingComments[postId]) {
            console.log(`Already loading comments for post ${postId}, skipping`);
            return;
        }

        const currentProvider = provider || walletProvider;
        if (!currentProvider) {
            console.error("No provider available to fetch comments");
            return;
        }

        try {
            // Marcar como cargando
            setLoadingComments(prev => ({
                ...prev,
                [postId]: true
            }));

            console.log(`Starting contract call to get comments for post ${postId}`);

            const contract = new Contract(forumAddress, forumABI, currentProvider);
            const commentsFromContract = await contract.getComments(postId);

            console.log(`Received ${commentsFromContract.length} comments from contract for post ${postId}`);

            // Filtrar solo comentarios activos y parsear datos
            const parsedComments = commentsFromContract
                .filter((comment: any) => comment.isActive)
                .map((comment: any) => ({
                    id: comment.id.toString(),
                    postId: postId,
                    author: comment.author,
                    content: comment.content,
                    timestamp: parseInt(comment.timestamp.toString(), 10),
                    isActive: comment.isActive
                }));

            // Ordenar por más recientes primero
            parsedComments.sort((a: Comment, b: Comment) => b.timestamp - a.timestamp);

            console.log(`Processed ${parsedComments.length} active comments for post ${postId}`);

            // Actualizar el estado
            setComments(prev => ({
                ...prev,
                [postId]: parsedComments
            }));

            return parsedComments;
        } catch (error) {
            console.error(`Error fetching comments for post ${postId}:`, error);
            return [];
        } finally {
            // Marcar como no cargando
            setLoadingComments(prev => ({
                ...prev,
                [postId]: false
            }));
        }
    };

    const addComment = async (postId: string) => {
        if (!newCommentText[postId]?.trim() || !isConnected || !walletProvider) {
            alert("Please enter a comment and connect your wallet");
            return;
        }

        try {
            setSubmittingComment(prev => ({
                ...prev,
                [postId]: true
            }));

            const signer = await walletProvider.getSigner();
            const contract = new Contract(forumAddress, forumABI, signer);

            console.log(`Adding comment to post ${postId}: "${newCommentText[postId]}"`);

            const tx = await contract.addComment(postId, newCommentText[postId]);
            console.log("Comment transaction submitted:", tx.hash);

            const receipt = await tx.wait();
            console.log("Comment transaction confirmed:", receipt);

            // Limpiar el input de comentario
            setNewCommentText(prev => ({
                ...prev,
                [postId]: ""
            }));

            // Primero refrescar los comentarios de este post específico
            await fetchCommentsForPost(postId);

            // Luego refrescar los posts para actualizar el contador de comentarios
            if (selectedCommunityId && fetchPostsForCommunity) {
                await fetchPostsForCommunity(selectedCommunityId);
            } else {
                await fetchPostsFromContract();
            }

            console.log(`Comment added to post ${postId} successfully and data refreshed.`);

            // Asegurar que los comentarios permanezcan visibles
            setExpandedComments(prev => ({
                ...prev,
                [postId]: true
            }));
        } catch (error) {
            console.error("Error adding comment:", error);
            alert("Failed to add comment. Make sure your wallet is connected and you have enough gas.");
        } finally {
            setSubmittingComment(prev => ({
                ...prev,
                [postId]: false
            }));
        }
    };

    const handleLikePost = async (postId: string) => {
        if (!isConnected || !walletProvider) {
            alert("Please connect your wallet to like posts");
            return;
        }

        if (likingPost[postId]) return;

        // Check if user already liked this post
        if (userLikedPosts[postId]) {
            alert("You have already liked this post. Unlike functionality is not available in the current contract.");
            return;
        }

        try {
            setLikingPost(prev => ({
                ...prev,
                [postId]: true
            }));

            const signer = await walletProvider.getSigner();
            const contract = new Contract(forumAddress, forumABI, signer);

            const tx = await contract.likePost(postId);
            await tx.wait();

            // Update local like status immediately
            setUserLikedPosts(prev => ({
                ...prev,
                [postId]: true
            }));

            // Usar la función adecuada para refrescar los posts
            if (selectedCommunityId && fetchPostsForCommunity) {
                // Si tenemos un ID de comunidad y la función específica, usarla
                await fetchPostsForCommunity(selectedCommunityId);
            } else {
                // De lo contrario, usar la función general
                await fetchPostsFromContract();
            }

            console.log(`Post ${postId} liked successfully. Posts refreshed.`);
        } catch (error) {
            console.error("Error liking post:", error);
            if (error instanceof Error && error.toString().includes("already liked")) {
                alert("You have already liked this post.");
                // Update local state to reflect this
                setUserLikedPosts(prev => ({
                    ...prev,
                    [postId]: true
                }));
            } else {
                alert("Failed to like post. Make sure your wallet is connected and you have enough gas.");
            }
        } finally {
            setLikingPost(prev => ({
                ...prev,
                [postId]: false
            }));
        }
    };

    // Helper functions
    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getCommunityName = (communityId: string) => {
        const community = localCommunities.find(c => c.id === communityId);
        return community ? community.name : `Community #${communityId}`;
    };

    const formatAddress = (address: string) => {
        if (!address) return "";
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };

    const [likeLoading, setLikeLoading] = useState<Record<string, boolean>>({});

    // Render Create Post Form
    const renderCreatePostForm = () => (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6 text-slate-900">
                New Post
            </h2>
            <div className="space-y-5">
                {/* Community Selector */}
                <div className="flex flex-col">
                    <label className="text-slate-600 font-medium mb-2 text-sm">Community</label>
                    <select
                        value={selectedCommunityId || ""}
                        onChange={handleCommunityChange}
                        className="bg-slate-50 border border-slate-200 text-slate-900 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                    >
                        <option value="" disabled>Select a community</option>
                        {communities.map(community => (
                            <option
                                key={community.id}
                                value={community.id}
                                disabled={!community.isMember && !community.isCreator}
                            >
                                {community.name} {community.isMember || community.isCreator ? "" : "(Join first)"}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-slate-500 mt-1">You can only create posts in communities you have joined.</p>
                </div>

                {/* Topic Selector */}
                {selectedCommunityId && (
                    <div className="flex flex-col">
                        <label className="text-slate-600 font-medium mb-2 text-sm">Topic</label>
                        <TopicsDropdown
                            onTopicSelect={handleTopicChange}
                            topics={communityTopics}
                            setTopics={(newTopics) => {
                                // Update the community topics when a new topic is added
                                setCommunityTopics(newTopics);
                            }}
                            disableAddingTopics={false}
                            selectedTopic={postSelectedTopic}
                        />
                    </div>
                )}

                {/* Post Content - Rich Text Editor */}
                <div className="flex flex-col">
                    <label className="text-slate-600 font-medium mb-2 text-sm">Content</label>
                    <MatrixEditor content={newPost} setContent={setNewPost} />
                </div>

                {/* Image Selector */}
                <div className="flex flex-col">
                    <label className="text-slate-600 font-medium mb-2 text-sm flex items-center">
                        <span>Attach Image</span>
                        <span className="ml-2 cursor-pointer">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="hidden"
                                id="image-upload"
                            />
                            <label htmlFor="image-upload" className="cursor-pointer">
                                <ImagePlus className="h-4 w-4 text-slate-400 hover:text-indigo-500" />
                            </label>
                        </span>
                    </label>
                    {selectedImage && (
                        <div className="mt-1 text-xs text-slate-500 p-3 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                            {selectedImage.name}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end items-center gap-3 pt-4">
                    <Button
                        onClick={() => setIsCreatingPost(false)}
                        className="bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 rounded-xl px-5"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmitPost}
                        className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl px-6 font-medium shadow-md shadow-indigo-200"
                        disabled={loading || !postSelectedTopic || !selectedCommunityId}
                    >
                        {loading ? (
                            <span className="animate-pulse">Publishing...</span>
                        ) : (
                            <>
                                Publish <Send className="h-3 w-3 ml-1" />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );

    // Render Create Community Form
    const renderCreateCommunityForm = () => (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6 text-slate-900">New Community</h2>
            <form className="space-y-5">
                <div className="flex flex-col">
                    <label className="text-slate-600 font-medium mb-2 text-sm">Community Name</label>
                    <input
                        type="text"
                        placeholder="Enter community name"
                        className="bg-slate-50 border border-slate-200 text-slate-900 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                        id="community-name"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-slate-600 font-medium mb-2 text-sm">Description</label>
                    <textarea
                        placeholder="What is this community about?"
                        className="bg-slate-50 border border-slate-200 text-slate-900 p-3 rounded-xl h-28 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 resize-none"
                        id="community-description"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-slate-600 font-medium mb-2 text-sm">Topics</label>
                    <input
                        type="text"
                        placeholder="General, Technology, Blockchain"
                        className="bg-slate-50 border border-slate-200 text-slate-900 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                        id="community-topics"
                    />
                    <p className="text-xs text-slate-400 mt-1.5">Comma separated, at least one required</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                        <label className="text-slate-600 font-medium mb-2 text-sm">Logo</label>
                        {communityLogoPreview ? (
                            <div className="relative group w-20 h-20">
                                <img 
                                    src={communityLogoPreview} 
                                    alt="Logo preview" 
                                    className="w-20 h-20 object-cover rounded-xl border border-slate-200"
                                />
                                <div 
                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-xl"
                                    onClick={() => {
                                        setTempCommunityLogoImage(communityLogoPreview);
                                        setShowCommunityLogoEditor(true);
                                    }}
                                >
                                    <span className="text-white text-xs font-medium">Adjust</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCommunityLogoPreview("");
                                        setCommunityLogoFile(null);
                                    }}
                                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                                >
                                    ×
                                </button>
                            </div>
                        ) : (
                            <input
                                type="file"
                                accept="image/*"
                                className="bg-slate-50 border border-slate-200 text-slate-900 p-2.5 rounded-xl file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 text-sm"
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

                    <div className="flex flex-col">
                        <label className="text-slate-600 font-medium mb-2 text-sm">Cover Image</label>
                        {communityCoverPreview ? (
                            <div className="relative group">
                                <img 
                                    src={communityCoverPreview} 
                                    alt="Cover preview" 
                                    className="w-full h-20 object-cover rounded-xl border border-slate-200"
                                />
                                <div 
                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-xl"
                                    onClick={() => {
                                        setTempCommunityCoverImage(communityCoverPreview);
                                        setShowCommunityCoverEditor(true);
                                    }}
                                >
                                    <span className="text-white text-xs font-medium">Click to adjust</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCommunityCoverPreview("");
                                        setCommunityCoverFile(null);
                                    }}
                                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                                >
                                    ×
                                </button>
                            </div>
                        ) : (
                            <input
                                type="file"
                                accept="image/*"
                                className="bg-slate-50 border border-slate-200 text-slate-900 p-2.5 rounded-xl file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 text-sm"
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

                <Button
                    type="button"
                    onClick={() => {
                        const nameElement = document.getElementById('community-name') as HTMLInputElement;
                        const descriptionElement = document.getElementById('community-description') as HTMLTextAreaElement;
                        const topicsElement = document.getElementById('community-topics') as HTMLInputElement;

                        const name = nameElement?.value || "";
                        const description = descriptionElement?.value || "";
                        const topicString = topicsElement?.value || "";
                        const topicsArray = topicString.split(',').map(t => t.trim()).filter(t => t);
                        // Use the edited files from state
                        const photo = communityLogoFile || undefined;
                        const cover = communityCoverFile || undefined;

                        if (name && description && topicsArray.length > 0) {
                            handleCreateCommunity(name, description, topicsArray, photo, cover);
                            // Reset state after submission
                            setCommunityCoverFile(null);
                            setCommunityCoverPreview("");
                            setCommunityLogoFile(null);
                            setCommunityLogoPreview("");
                        } else {
                            alert("Please fill in all fields");
                        }
                    }}
                    className="w-full bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl py-3 font-medium shadow-md shadow-indigo-200 transition-all"
                    disabled={creatingCommunity}
                >
                    {creatingCommunity ? (
                        <div className="flex items-center justify-center">
                            <span className="animate-pulse">Creating...</span>
                        </div>
                    ) : "Create Community"}
                </Button>
            </form>
        </div>
    );

    // Render Communities List
    const renderCommunitiesList = () => (
        <div className="space-y-6">
            {localCommunities.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-2xl">
                    <p className="text-slate-500 font-medium">No communities yet</p>
                    <p className="text-slate-400 text-sm mt-1">Create the first one!</p>
                </div>
            ) : (
                [...localCommunities]
                    .sort((a, b) => {
                        const idA = parseInt(a.id) || a.id;
                        const idB = parseInt(b.id) || b.id;
                        return typeof idA === 'number' && typeof idB === 'number'
                            ? idB - idA
                            : String(idB).localeCompare(String(idA));
                    }).map((community) => (
                        <div
                            key={community.id}
                            className={`relative rounded-3xl overflow-hidden cursor-pointer transition-all hover:shadow-xl bg-white border ${selectedCommunityId === community.id
                                ? "ring-2 ring-indigo-400 border-indigo-200"
                                : "border-slate-200 hover:border-slate-300"
                                }`}
                            onClick={() => handleCommunityClick(community)}
                        >
                            {/* Banner section */}
                            <div className="relative h-40">
                                {community.coverImage ? (
                                    <>
                                        <img 
                                            src={`https://gateway.pinata.cloud/ipfs/${community.coverImage}`} 
                                            alt={`${community.name} cover`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                                    </>
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-indigo-100 via-slate-100 to-slate-50"></div>
                                )}
                                
                                {/* Actions on top-right of banner */}
                                <div className="absolute top-4 right-4 flex items-center gap-2">
                                    {community.isCreator && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Aquí implementaríamos la navegación a una página de edición de comunidad
                                                console.log(`Editar comunidad: ${community.id}`);
                                                // Por ejemplo: router.push(`/comunidad/editar/${community.id}`);
                                                alert(`Función para editar comunidad ${community.name} (ID: ${community.id})`);
                                            }}
                                            className="text-xs py-1.5 px-3 rounded-full transition-colors bg-white/90 hover:bg-white text-slate-600 font-medium shadow-sm"
                                        >
                                            Editar Comunidad
                                        </button>
                                    )}
                                    {!community.isCreator && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (community.isMember) {
                                                    handleLeaveCommunity(community.id);
                                                } else {
                                                    handleJoinCommunity(community.id);
                                                }
                                            }}
                                            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all shadow-sm ${joiningCommunityId === community.id || leavingCommunityId === community.id
                                                ? "bg-slate-200 text-slate-500"
                                                : community.isMember
                                                    ? "bg-white/90 hover:bg-white text-slate-600"
                                                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                                }`}
                                            disabled={joiningCommunityId === community.id || leavingCommunityId === community.id}
                                        >
                                            {joiningCommunityId === community.id ? "Joining..." 
                                                : leavingCommunityId === community.id ? "Leaving..." 
                                                : community.isMember ? "Leave" : "Join"}
                                        </button>
                                    )}
                                </div>

                                {/* Avatar + Name + Description on bottom-left of banner */}
                                <div className="absolute bottom-0 left-0 right-0 p-5">
                                    <div className="flex items-end gap-4">
                                        {/* Avatar */}
                                        <div className="flex-shrink-0 w-16 h-16 rounded-2xl border-3 border-white bg-white shadow-lg overflow-hidden">
                                            {community.photo ? (
                                                <img 
                                                    src={`https://gateway.pinata.cloud/ipfs/${community.photo}`} 
                                                    alt={community.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600 font-semibold text-xl">
                                                    {community.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Name + Description */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className={`text-2xl font-semibold tracking-tight truncate ${community.coverImage ? 'text-white drop-shadow-md' : 'text-slate-900'}`}>
                                                {community.name}
                                            </h3>
                                            <p className={`text-sm mt-0.5 line-clamp-1 ${community.coverImage ? 'text-white/80' : 'text-slate-500'}`}>
                                                {community.description}
                                            </p>
                                        </div>

                                        {/* Stats on bottom-right */}
                                        <div className={`flex-shrink-0 text-right ${community.coverImage ? 'text-white/90' : 'text-slate-500'}`}>
                                            <div className="text-sm font-medium">{community.memberCount || 0} members</div>
                                            <div className="text-xs opacity-80">{community.postCount} posts</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Content below banner */}
                            <div className="px-6 py-5">
                                {/* Add Topic Form */}
                                <div
                                    className={`rounded-xl overflow-hidden transition-all duration-300 ${showAddTopicForm[community.id]
                                        ? 'max-h-20 opacity-100 p-4 bg-slate-50 mb-4'
                                        : 'max-h-0 opacity-0 p-0 mb-0'
                                        }`}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {showAddTopicForm[community.id] && (
                                        <form onSubmit={(e) => handleAddTopic(community.id, e)} className="flex gap-3">
                                            <input
                                                type="text"
                                                ref={topicInputRef}
                                                value={newTopic}
                                                onChange={(e) => setNewTopic(e.target.value)}
                                                placeholder="New topic name"
                                                className="flex-grow bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <button
                                                type="submit"
                                                className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-indigo-700 transition-colors"
                                                disabled={isSubmittingTopic}
                                            >
                                                {isSubmittingTopic ? "..." : "Add"}
                                            </button>
                                        </form>
                                    )}
                                </div>

                                {/* Topics + Badge row */}
                                <div className="flex items-center justify-between gap-4">
                                    {/* Topics - subtle styling */}
                                    <div className="flex flex-wrap gap-1.5 flex-1">
                                        {community.topics.slice(0, 4).map((topic, index) => (
                                            <button
                                                key={index}
                                                onClick={(e) => handleTopicClick(e, topic)}
                                                className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                                            >
                                                {topic}
                                            </button>
                                        ))}
                                        {community.topics.length > 4 && (
                                            <span className="px-2.5 py-1 text-xs text-slate-400">
                                                +{community.topics.length - 4} more
                                            </span>
                                        )}
                                    </div>

                                    {/* Role badge - light styling */}
                                    {community.isCreator && (
                                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600 border border-indigo-100">
                                            Creator
                                        </span>
                                    )}
                                    {community.isMember && !community.isCreator && (
                                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                            Member
                                        </span>
                                    )}
                                </div>

                                {topicError && showAddTopicForm[community.id] && (
                                    <div className="text-red-500 text-xs mt-2">{topicError}</div>
                                )}
                            </div>
                        </div>
                    ))
            )}
        </div>
    );

    // Render Posts List
    const renderPostsList = () => (
        <div className="space-y-6">
            {/* Topics filter strip */}
            <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="text-slate-500 text-sm mr-2">Filter:</span>

                    {/* Show all option */}
                    <button
                        onClick={() => setSelectedTopic(null)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedTopic === null
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            }`}
                    >
                        All
                    </button>

                    {/* Topic pills */}
                    {availableTopics.map((topic) => (
                        <button
                            key={topic}
                            onClick={() => setSelectedTopic(topic)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedTopic === topic
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                }`}
                        >
                            {topic}
                        </button>
                    ))}

                    {/* New Topic button - only visible to community creator */}
                    {selectedCommunityId && localCommunities.find(c => c.id === selectedCommunityId)?.isCreator && (
                        <button
                            onClick={() => handleQuickAddTopic(selectedCommunityId)}
                            disabled={isSubmittingTopic}
                            className="ml-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmittingTopic ? "Adding..." : "+ New Topic"}
                        </button>
                    )}
                </div>

                {/* Community info */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-slate-500 text-sm">
                        {selectedCommunityId ? (
                            <>
                                Viewing: <span className="text-slate-900 font-medium">{getCommunityName(selectedCommunityId)}</span>
                            </>
                        ) : (
                            "All communities"
                        )}
                    </span>
                </div>
            </div>

            {selectedCommunityId && (
                <div className="mb-4">
                    {(() => {
                        const community = localCommunities.find(c => c.id === selectedCommunityId);
                        return community?.coverImage ? (
                            <div className="relative mb-12">
                                {/* Cover image container */}
                                <div className="w-full h-44 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                                    <img 
                                        src={`https://gateway.pinata.cloud/ipfs/${community.coverImage}`} 
                                        alt={`${getCommunityName(selectedCommunityId)} cover`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            // If image fails to load, hide the container
                                            const target = e.target as HTMLImageElement;
                                            target.parentElement!.style.display = 'none';
                                        }}
                                    />
                                </div>
                                {/* Community photo overlapping cover image */}
                                <div className="absolute -bottom-10 left-6 flex items-end gap-4">
                                    {community.photo && (
                                        <div className="w-28 h-28 rounded-2xl border-4 border-white overflow-hidden bg-white shadow-xl">
                                            <img 
                                                src={`https://gateway.pinata.cloud/ipfs/${community.photo}`} 
                                                alt={community.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    // Fallback to a default image
                                                    (e.target as HTMLImageElement).src = '/community-placeholder.png';
                                                }}
                                            />
                                        </div>
                                    )}
                                    {/* Community name next to photo */}
                                    <div className="mb-2">
                                        <h2 className="text-2xl font-semibold text-slate-900">{community.name}</h2>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Fallback when no cover image
                            <div className="w-full p-4 rounded-2xl border border-slate-200 bg-white/90 backdrop-blur-sm mb-4 flex items-center shadow-sm">
                                {community?.photo ? (
                                    <div className="w-16 h-16 rounded-full border-2 border-slate-200 overflow-hidden mr-4">
                                        <img 
                                            src={`https://gateway.pinata.cloud/ipfs/${community.photo}`} 
                                            alt={community.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                // Fallback to a default image
                                                (e.target as HTMLImageElement).src = '/community-placeholder.png';
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 font-semibold border-2 border-slate-200 mr-4">
                                        {community?.name.charAt(0).toUpperCase() || "C"}
                                    </div>
                                )}
                                <h2 className="text-xl font-semibold text-slate-900">{community?.name}</h2>
                            </div>
                        );
                    })()}
                </div>
            )}
            {filteredPosts.length === 0 ? (
                <div className="p-8 text-center bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-700 mb-2 font-medium">No posts found with the current filters.</p>
                    <p className="text-slate-500 text-sm">
                        {selectedTopic
                            ? `There are no posts with the topic "${selectedTopic}".`
                            : selectedCommunityId
                                ? "This community doesn't have any posts yet."
                                : "None of your communities have posts yet."}
                    </p>
                </div>
            ) : (
                filteredPosts.map((post) => (
                    <div
                        key={post.id}
                        className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                {/* User profile with avatar and nickname */}
                                <div className="flex items-center mb-2">
                                    <UserAvatar 
                                        address={post.author || ''} 
                                        size="md" 
                                        showNickname={true}
                                        className="mr-3"
                                    />
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <span>{formatDate(post.timestamp)}</span>
                                            <span>•</span>
                                            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                                                {post.topic}
                                            </span>
                                            <span>•</span>
                                            <span className="text-slate-500">{getCommunityName(post.communityId)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Post content */}
                        <div className="mt-4">
                            <FormattedContent htmlContent={post.content} />
                        </div>

                        {post.imageUrl && (
                            <div className="mt-4 flex justify-center">
                                <img
                                    src={post.imageUrl}
                                    alt="Post attachment"
                                    className="max-w-full max-h-96 rounded-xl border border-slate-200 object-contain"
                                />
                            </div>
                        )}

                        <div className="flex items-center mt-5 pt-4 border-t border-slate-100 gap-4 text-sm text-slate-400">
                            <button
                                onClick={() => handleLikePost(post.id)}
                                className={`flex items-center gap-1.5 transition-colors ${
                                    userLikedPosts[post.id] 
                                        ? 'text-rose-500 cursor-default' 
                                        : 'hover:text-rose-500'
                                }`}
                                disabled={likingPost[post.id]}
                                title={userLikedPosts[post.id] ? 'You liked this post (unlike not available)' : 'Like this post'}
                            >
                                <span className={`${likingPost[post.id] ? 'animate-pulse' : ''}`}>
                                    {likingPost[post.id] ? '💗' : userLikedPosts[post.id] ? '❤️' : '🤍'}
                                </span>
                                <span>{post.likeCount}</span>
                            </button>
                            <button
                                onClick={() => toggleComments(post.id)}
                                className="flex items-center gap-1.5 hover:text-indigo-500 transition-colors"
                            >
                                <span>💬</span>
                                <span>{post.commentCount}</span>
                            </button>
                        </div>

                        {/* Comments section */}
                        {expandedComments[post.id] && (
                            <div className="mt-5 pt-4 border-t border-slate-100">
                                <h3 className="text-slate-600 mb-4 font-medium text-sm">Comments</h3>

                                {/* Comment input */}
                                <div className="flex mb-5 gap-3">
                                    <input
                                        type="text"
                                        value={newCommentText[post.id] || ""}
                                        onChange={(e) => setNewCommentText({
                                            ...newCommentText,
                                            [post.id]: e.target.value
                                        })}
                                        placeholder="Write a comment..."
                                        className="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                addComment(post.id);
                                            }
                                        }}
                                        disabled={submittingComment[post.id]}
                                    />
                                    <button
                                        onClick={() => addComment(post.id)}
                                        className="bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm font-medium"
                                        disabled={submittingComment[post.id]}
                                    >
                                        {submittingComment[post.id] ? "..." : "Send"}
                                    </button>
                                </div>

                                {/* Comments list */}
                                <div className="space-y-3 mb-4">
                                    {loadingComments[post.id] ? (
                                        <div className="text-center text-slate-500">
                                            Loading comments...
                                        </div>
                                    ) : comments[post.id]?.length > 0 ? (
                                        comments[post.id]
                                            .filter(comment => !isUserHidden(comment.author))
                                            .sort((a, b) => Number(a.timestamp) - Number(b.timestamp))
                                            .map((comment) => (
                                            <div key={comment.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50">
                                                <div className="flex items-start mb-2">
                                                    <div className="mr-3 flex-shrink-0">
                                                        <UserAvatar 
                                                            address={comment.author || ''} 
                                                            size="sm"
                                                            showNickname={true}
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-end items-center">
                                                            <span className="text-slate-400 text-xs">
                                                                {formatDate(comment.timestamp)}
                                                            </span>
                                                        </div>
                                                        <p className="text-slate-700 text-sm mt-1">{comment.content}</p>
                                                        
                                                        {/* Comment actions - like functionality not available in contract */}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-slate-500 text-sm italic">No comments yet. Be the first to comment!</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );

    // Check if user has any communities they're a member of or creator of
    const hasAccessibleCommunities = useMemo(() => {
        return localCommunities.some(community => community.isMember || community.isCreator);
    }, [localCommunities]);

    return (
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-slate-100 shadow-xl">
            {/* Header section with title and actions */}
            <div className="flex items-center justify-between mb-8">
                {/* Title */}
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                        {isCreatingCommunity
                            ? "Create Community"
                            : isCreatingPost
                                ? "Create Post"
                                : showCommunityList
                                    ? "Communities"
                                    : "Posts"}
                    </h1>
                    {!showCommunityList && selectedTopic && (
                        <p className="text-slate-500 text-sm mt-1">Filtered by: {selectedTopic}</p>
                    )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3">
                    {/* Create Community - primary action */}
                    {showCommunityList && (
                        <Button
                            onClick={() => setIsCreatingCommunity(!isCreatingCommunity)}
                            className={`rounded-full px-6 font-medium ${isCreatingCommunity
                                ? "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200"
                                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200"}`}
                        >
                            {isCreatingCommunity ? "Cancel" : "Create Community"}
                        </Button>
                    )}

                    {/* Create Post - primary action */}
                    {!showCommunityList && !isCreatingCommunity && (
                        <Button
                            onClick={() => setIsCreatingPost(!isCreatingPost)}
                            className={`rounded-full px-6 font-medium ${isCreatingPost
                                ? "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200"
                                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200"}`}
                        >
                            {isCreatingPost ? "Cancel" : "Create Post"}
                        </Button>
                    )}
                </div>
            </div>

            {/* Main content area */}
            {isCreatingCommunity ? (
                renderCreateCommunityForm()
            ) : isCreatingPost ? (
                renderCreatePostForm()
            ) : showCommunityList ? (
                renderCommunitiesList()
            ) : (
                renderPostsList()
            )}

            {/* Community Cover Image Editor Modal */}
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

            {/* Community Logo Image Editor Modal */}
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
        </div>
    );
}
