"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Contract } from "ethers";
import { useWalletContext } from "@/contexts/WalletContext";
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
    setSelectedCommunityId: externalSetSelectedCommunityId
}: IntegratedViewProps) => {
    const { isConnected, provider: walletProvider } = useWalletContext();

    // State for both components
    const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
    const [showCommunityList, setShowCommunityList] = useState(true);
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
        // Si hay una comunidad seleccionada específicamente, mostrar solo sus posts
        if (selectedCommunityId) {
            return posts.filter(post =>
                post.communityId === selectedCommunityId &&
                (selectedTopic ? post.topic === selectedTopic : true)
            );
        }

        // Si no hay comunidad seleccionada, mostrar posts de comunidades donde el usuario es miembro
        const userCommunities = localCommunities
            .filter(c => c.isMember || c.isCreator)
            .map(c => c.id);

        return posts.filter((post) => {
            const matchesCommunity = userCommunities.includes(post.communityId);
            const matchesTopic = selectedTopic ? post.topic === selectedTopic : true;
            return matchesCommunity && matchesTopic;
        });
    }, [posts, selectedCommunityId, selectedTopic, localCommunities]);

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

    const likePost = async (postId: string) => {
        if (!isConnected || !walletProvider) {
            alert("Please connect your wallet to like posts");
            return;
        }

        if (likingPost[postId]) return;

        try {
            setLikingPost(prev => ({
                ...prev,
                [postId]: true
            }));

            const signer = await walletProvider.getSigner();
            const contract = new Contract(forumAddress, forumABI, signer);

            const tx = await contract.likePost(postId);
            await tx.wait();

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

    // Function to like a comment
    const likeComment = async (commentId: string) => {
        if (!isConnected || !walletProvider) {
            alert("Please connect your wallet to like comments");
            return;
        }

        if (likingComment[commentId]) return;

        try {
            setLikingComment(prev => ({
                ...prev,
                [commentId]: true
            }));

            const signer = await walletProvider.getSigner();
            const contract = new Contract(forumAddress, forumABI, signer);

            // Assuming the contract has a likeComment function that takes the comment ID
            const tx = await contract.likeComment(commentId);
            await tx.wait();

            // Update the comments with the new like count
            await fetchCommentsForPost(comments[commentId]?.[0]?.postId);

            console.log(`Comment ${commentId} liked successfully. Comments refreshed.`);
        } catch (error) {
            console.error("Error liking comment:", error);
            if (error instanceof Error && error.toString().includes("already liked")) {
                alert("You have already liked this comment.");
            } else {
                alert("Failed to like comment. Make sure your wallet is connected and you have enough gas.");
            }
        } finally {
            setLikingComment(prev => ({
                ...prev,
                [commentId]: false
            }));
        }
    };


    const [likeLoading, setLikeLoading] = useState<Record<string, boolean>>({});
    const [likingComment, setLikingComment] = useState<Record<string, boolean>>({});

    // Render Create Post Form
    const renderCreatePostForm = () => (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200 p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-center text-slate-900">
                Create New Post
            </h2>
            <div className="space-y-4">
                {/* Community Selector */}
                <div className="flex flex-col">
                    <label className="text-slate-700 font-medium mb-1 text-sm">Community</label>
                    <select
                        value={selectedCommunityId || ""}
                        onChange={handleCommunityChange}
                        className="bg-white border border-slate-200 text-slate-900 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
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
                        <label className="text-slate-700 font-medium mb-1 text-sm">Topic</label>
                        <TopicsDropdown
                            onTopicSelect={handleTopicChange}
                            topics={communityTopics}
                            setTopics={() => { }} // We're not adding topics here
                            disableAddingTopics={true}
                            selectedTopic={postSelectedTopic}
                        />
                    </div>
                )}

                {/* Post Content - Rich Text Editor */}
                <div className="flex flex-col">
                    <label className="text-slate-700 font-medium mb-1 text-sm">Content</label>
                    <MatrixEditor content={newPost} setContent={setNewPost} />
                </div>

                {/* Image Selector */}
                <div className="flex flex-col">
                    <label className="text-slate-700 font-medium mb-1 text-sm flex items-center">
                        <span>Image</span>
                        <span className="ml-2 cursor-pointer">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="hidden"
                                id="image-upload"
                            />
                            <label htmlFor="image-upload" className="cursor-pointer">
                                <ImagePlus className="h-4 w-4 text-slate-500 hover:text-sky-600" />
                            </label>
                        </span>
                    </label>
                    {selectedImage && (
                        <div className="mt-1 text-xs text-slate-600 p-3 border border-dashed border-slate-300 rounded-xl bg-slate-50">
                            {selectedImage.name}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-2">
                    <Button
                        onClick={() => setIsCreatingPost(false)}
                        className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-full px-5"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmitPost}
                        className="bg-slate-900 text-white hover:bg-slate-800 rounded-full px-5"
                        disabled={loading || !postSelectedTopic || !selectedCommunityId}
                    >
                        {loading ? (
                            <div className="flex items-center">
                                <span className="mr-2 animate-pulse">Publishing...</span>
                            </div>
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
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200 p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-center text-slate-900">Create New Community</h2>
            <form className="space-y-4">
                <div className="flex flex-col">
                    <label className="text-slate-700 font-medium mb-1 text-sm">Community Name</label>
                    <input
                        type="text"
                        placeholder="Enter community name"
                        className="bg-white border border-slate-200 text-slate-900 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
                        id="community-name"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-slate-700 font-medium mb-1 text-sm">Description</label>
                    <textarea
                        placeholder="What is this community about?"
                        className="bg-white border border-slate-200 text-slate-900 p-3 rounded-xl h-32 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
                        id="community-description"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-slate-700 font-medium mb-1 text-sm">Topics (comma separated)</label>
                    <input
                        type="text"
                        placeholder="General, Technology, Blockchain"
                        className="bg-white border border-slate-200 text-slate-900 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
                        id="community-topics"
                    />
                    <p className="text-xs text-slate-500 mt-1">At least one topic is required</p>
                </div>

                <div className="flex flex-col">
                    <label className="text-slate-700 font-medium mb-1 text-sm">Photo</label>
                    <input
                        type="file"
                        accept="image/*"
                        className="bg-white border border-slate-200 text-slate-900 p-3 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                        id="community-photo"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-slate-700 font-medium mb-1 text-sm">Cover Image</label>
                    <input
                        type="file"
                        accept="image/*"
                        className="bg-white border border-slate-200 text-slate-900 p-3 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                        id="community-cover"
                    />
                </div>

                <Button
                    type="button"
                    onClick={() => {
                        const nameElement = document.getElementById('community-name') as HTMLInputElement;
                        const descriptionElement = document.getElementById('community-description') as HTMLTextAreaElement;
                        const topicsElement = document.getElementById('community-topics') as HTMLInputElement;
                        const photoElement = document.getElementById('community-photo') as HTMLInputElement;
                        const coverElement = document.getElementById('community-cover') as HTMLInputElement;

                        const name = nameElement?.value || "";
                        const description = descriptionElement?.value || "";
                        const topicString = topicsElement?.value || "";
                        const topicsArray = topicString.split(',').map(t => t.trim()).filter(t => t);
                        const photo = photoElement?.files?.[0];
                        const cover = coverElement?.files?.[0];

                        if (name && description && topicsArray.length > 0) {
                            handleCreateCommunity(name, description, topicsArray, photo, cover);
                        } else {
                            alert("Please fill in all fields");
                        }
                    }}
                    className="w-full bg-slate-900 text-white hover:bg-slate-800 rounded-full py-3"
                    disabled={creatingCommunity}
                >
                    {creatingCommunity ? (
                        <div className="flex items-center justify-center">
                            <span className="mr-2 animate-pulse">Creating...</span>
                        </div>
                    ) : "Create Community"}
                </Button>
            </form>
        </div>
    );

    // Render Communities List
    const renderCommunitiesList = () => (
        <div>
            <div className="space-y-4">
                {localCommunities.length === 0 ? (
                    <p className="text-center text-slate-500">No communities found. Create the first one!</p>
                ) : (
                    [...localCommunities]
                        .sort((a, b) => {
                            // Convertir IDs a números si es posible o comparar como strings
                            const idA = parseInt(a.id) || a.id;
                            const idB = parseInt(b.id) || b.id;

                            // Orden descendente (b - a)
                            return typeof idA === 'number' && typeof idB === 'number'
                                ? idB - idA
                                : String(idB).localeCompare(String(idA));
                        }).map((community) => (
                            <div
                                key={community.id}
                                className={`rounded-2xl p-5 flex flex-col bg-white/90 backdrop-blur-sm cursor-pointer transition-all shadow-sm hover:shadow-md ${selectedCommunityId === community.id
                                    ? "border-2 border-sky-400 ring-2 ring-sky-100"
                                    : "border border-slate-200 hover:border-slate-300"
                                    }`}
                                onClick={() => handleCommunityClick(community)}
                            >
                                {/* Cover image with overlapping community photo */}
                                <div className={`relative ${community.coverImage ? 'mb-14' : 'mb-3'}`}>
                                    {community.coverImage && (
                                        <div className="w-full h-36 rounded-xl overflow-hidden -mt-5 -mx-5 px-5 pt-5" style={{width: 'calc(100% + 2.5rem)'}}>
                                            <img 
                                                src={`https://gateway.pinata.cloud/ipfs/${community.coverImage}`} 
                                                alt={`${community.name} cover`}
                                                className="w-full h-full object-cover rounded-t-xl"
                                                onError={(e) => {
                                                    // If image fails to load, hide the container
                                                    const target = e.target as HTMLImageElement;
                                                    target.parentElement!.style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    )}
                                    
                                    {/* Community Photo - overlapping cover */}
                                    <div className={`${community.coverImage ? 'absolute -bottom-12 left-4' : ''} flex items-end gap-4`}>
                                        <div className={`flex-shrink-0 ${community.coverImage ? 'w-24 h-24' : 'w-16 h-16'} overflow-hidden rounded-2xl border-4 border-white bg-white shadow-lg`}>
                                            {community.photo ? (
                                                <img 
                                                    src={`https://gateway.pinata.cloud/ipfs/${community.photo}`} 
                                                    alt={community.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        // Fallback to a default image
                                                        (e.target as HTMLImageElement).src = '/community-placeholder.png';
                                                    }}
                                                />
                                            ) : (
                                                // Placeholder for communities without a photo
                                                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-600 font-bold text-2xl">
                                                    {community.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        {community.coverImage && (
                                            <h3 className="text-xl font-semibold text-slate-900 mb-1">{community.name}</h3>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex justify-between items-start mb-3">
                                    {!community.coverImage && (
                                        <h3 className="text-xl font-semibold text-slate-900">{community.name}</h3>
                                    )}
                                    {community.coverImage && <div></div>}
                                    <div className="flex flex-col items-end">
                                        <div className="flex space-x-2">
                                            <span className="text-slate-500 text-sm">
                                                {community.memberCount || 0} members
                                                {community.isCreator && " (including you)"}
                                            </span>
                                        </div>
                                        <span className="text-slate-500 text-sm">{community.postCount} posts</span>
                                    </div>
                                </div>

                                <p className="text-slate-600 mb-3">
                                    {community.description.length > 100
                                        ? community.description.substring(0, 100) + "..."
                                        : community.description}
                                </p>

                                {/* Topics section */}
                                <div className="mb-3">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-slate-600 font-medium">Topics:</span>

                                        {/* Add Topic Button - Only shown for creators */}
                                        {community.isCreator && (
                                            <button
                                                onClick={(e) => toggleAddTopicForm(community.id, e)}
                                                className={`text-xs py-1.5 px-3 rounded-lg transition-colors ${showAddTopicForm[community.id] 
                                                    ? 'bg-slate-100 text-slate-700' 
                                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {showAddTopicForm[community.id] ? "Cancel" : "Add Topic"}
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {community.topics.map((topic, index) => (
                                            <button
                                                key={index}
                                                onClick={(e) => handleTopicClick(e, topic)}
                                                className="px-3 py-1 bg-sky-50 text-sky-700 text-xs rounded-full border border-sky-200 hover:bg-sky-100 cursor-pointer transition-colors"
                                            >
                                                {topic}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Add Topic Form */}
                                <div
                                    className={`mb-3 bg-slate-50 rounded-xl overflow-hidden transition-all duration-300 ${showAddTopicForm[community.id]
                                        ? 'max-h-24 opacity-100 p-3'
                                        : 'max-h-0 opacity-0 p-0'
                                        }`}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {showAddTopicForm[community.id] && (
                                        <form onSubmit={(e) => handleAddTopic(community.id, e)} className="flex flex-col">
                                            <div className="flex mb-2 gap-2">
                                                <input
                                                    type="text"
                                                    ref={topicInputRef}
                                                    value={newTopic}
                                                    onChange={(e) => setNewTopic(e.target.value)}
                                                    placeholder="Enter new topic name"
                                                    className="flex-grow bg-white border border-slate-200 rounded-lg p-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <button
                                                    type="submit"
                                                    className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-800 transition-colors"
                                                    disabled={isSubmittingTopic}
                                                >
                                                    {isSubmittingTopic ? "Adding..." : "Add"}
                                                </button>
                                            </div>

                                            {topicError && (
                                                <div className="text-red-500 text-xs mb-1">
                                                    {topicError}
                                                </div>
                                            )}
                                        </form>
                                    )}
                                </div>

                                <div className="flex justify-between items-center">
                                    <div className="flex items-center space-x-2">
                                        {/* Status badges */}
                                        {community.isCreator && (
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                                                Creator
                                            </span>
                                        )}
                                        {community.isMember && !community.isCreator && (
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-700 border border-sky-200">
                                                Member
                                            </span>
                                        )}
                                    </div>

                                    {/* Join/Leave button - Only show for non-creators */}
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
                                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${joiningCommunityId === community.id || leavingCommunityId === community.id
                                                ? "bg-slate-200 text-slate-500"
                                                : community.isMember
                                                    ? "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                                                    : "bg-slate-900 hover:bg-slate-800 text-white"
                                                }`}
                                            disabled={joiningCommunityId === community.id || leavingCommunityId === community.id}
                                        >
                                            {joiningCommunityId === community.id ? (
                                                <span className="animate-pulse">Joining...</span>
                                            ) : leavingCommunityId === community.id ? (
                                                <span className="animate-pulse">Leaving...</span>
                                            ) : community.isMember ? (
                                                "Leave"
                                            ) : (
                                                "Join"
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                )}
            </div>
        </div>
    );

    // Render Posts List
    const renderPostsList = () => (
        <div className="space-y-6">
            {/* Topics filter strip */}
            <div className="mb-4 p-4 bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-slate-600 font-medium text-sm">Filter by topic:</span>

                    {/* Show all option */}
                    <button
                        onClick={() => setSelectedTopic(null)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedTopic === null
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                            }`}
                    >
                        All
                    </button>

                    {/* Topic pills */}
                    {availableTopics.map((topic) => (
                        <button
                            key={topic}
                            onClick={() => setSelectedTopic(topic)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedTopic === topic
                                ? "bg-sky-600 text-white"
                                : "bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100"
                                }`}
                        >
                            {topic}
                        </button>
                    ))}
                </div>

                {/* Community info and back button */}
                <div className="flex items-center justify-between">
                    <span className="text-slate-600 text-sm">
                        {selectedCommunityId ? (
                            <>
                                Viewing posts in: <span className="text-slate-900 font-semibold">
                                    {getCommunityName(selectedCommunityId)}
                                </span>
                            </>
                        ) : (
                            <>
                                Viewing posts from all your communities
                            </>
                        )}
                    </span>
                    <button
                        onClick={toggleView}
                        className="text-slate-600 text-xs border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        Back to Communities
                    </button>
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
                        className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="flex justify-between items-start mb-2">
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
                                        <div className="flex items-center space-x-2 text-xs text-slate-500">
                                            <span>{formatDate(post.timestamp)}</span>
                                            <span>•</span>
                                            <span className="bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full border border-sky-200">
                                                {post.topic}
                                            </span>
                                            <span>•</span>
                                            <span>{getCommunityName(post.communityId)}</span>
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

                        <div className="flex items-center mt-4 space-x-4 text-sm text-slate-500">
                            <button
                                onClick={() => likePost(post.id)}
                                className="flex items-center space-x-1 hover:text-rose-500 transition-colors"
                                disabled={likingPost[post.id]}
                            >
                                <span className={`${likingPost[post.id] ? 'animate-pulse' : ''}`}>
                                    {likingPost[post.id] ? '💗' : '❤️'}
                                </span>
                                <span>{post.likeCount} likes</span>
                            </button>
                            <button
                                onClick={() => toggleComments(post.id)}
                                className="flex items-center space-x-2 hover:text-sky-500 transition-colors"
                            >
                                <span>💬</span>
                                <span className="relative">
                                    {post.commentCount} comments
                                </span>
                            </button>
                        </div>

                        {/* Comments section */}
                        {expandedComments[post.id] && (
                            <div className="mt-4 w-full border-t border-slate-200 pt-4">
                                <h3 className="text-slate-700 mb-3 font-medium">Comments</h3>

                                {/* Comment input */}
                                <div className="flex mt-2 mb-4 gap-2">
                                    <input
                                        type="text"
                                        value={newCommentText[post.id] || ""}
                                        onChange={(e) => setNewCommentText({
                                            ...newCommentText,
                                            [post.id]: e.target.value
                                        })}
                                        placeholder="Add your comment..."
                                        className="flex-grow bg-white border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                addComment(post.id);
                                            }
                                        }}
                                        disabled={submittingComment[post.id]}
                                    />
                                    <button
                                        onClick={() => addComment(post.id)}
                                        className="bg-slate-900 text-white px-5 py-2 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
                                        disabled={submittingComment[post.id]}
                                    >
                                        {submittingComment[post.id] ? "Sending..." : "Send"}
                                    </button>
                                </div>

                                {/* Comments list */}
                                <div className="space-y-3 mb-4">
                                    {loadingComments[post.id] ? (
                                        <div className="text-center text-slate-500">
                                            Loading comments...
                                        </div>
                                    ) : comments[post.id]?.length > 0 ? (
                                        comments[post.id].map((comment) => (
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
                                                        
                                                        {/* Comment actions */}
                                                        <div className="flex mt-2 space-x-4 text-xs">
                                                            <button
                                                                onClick={() => likeComment(comment.id)}
                                                                className="flex items-center space-x-1 text-slate-500 hover:text-rose-500 transition-colors"
                                                                disabled={likingComment[comment.id]}
                                                            >
                                                                <span className={`${likingComment[comment.id] ? 'animate-pulse' : ''}`}>
                                                                    {likingComment[comment.id] ? '💗' : '❤️'}
                                                                </span>
                                                                <span>{comment.likeCount || 0} likes</span>
                                                            </button>
                                                        </div>
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
        <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-slate-200 shadow-lg">
            {/* Title always at top */}
            <h1 className="text-2xl font-semibold text-center text-slate-900 mb-4">
                {isCreatingCommunity
                    ? "Create New Community"
                    : isCreatingPost
                        ? "Create New Post"
                        : showCommunityList
                            ? "Communities"
                            : `Posts ${selectedTopic ? `- Topic: ${selectedTopic}` : ""}`}
            </h1>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
                <div className="flex gap-2">
                    {/* Show View Posts button if user has communities and we're in communities view */}
                    {showCommunityList && hasAccessibleCommunities && !isCreatingCommunity && (
                        <Button
                            onClick={() => {
                                setShowCommunityList(false);
                            }}
                            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-full px-5"
                        >
                            View Posts
                        </Button>
                    )}
                </div>

                {/* Right side buttons */}
                <div className="flex gap-2">
                    {/* Create/Cancel community button - Only in Communities view */}
                    {showCommunityList && (
                        <Button
                            onClick={() => setIsCreatingCommunity(!isCreatingCommunity)}
                            className={`rounded-full px-5 ${isCreatingCommunity
                                ? "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                                : "bg-slate-900 text-white hover:bg-slate-800"}`}
                        >
                            {isCreatingCommunity ? "Cancel" : "Create Community"}
                        </Button>
                    )}

                    {/* Create/Cancel post button - Only in Posts view */}
                    {!showCommunityList && !isCreatingCommunity && (
                        <Button
                            onClick={() => setIsCreatingPost(!isCreatingPost)}
                            className={`rounded-full px-5 ${isCreatingPost
                                ? "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                                : "bg-slate-900 text-white hover:bg-slate-800"}`}
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
        </div>
    );
}
