"use client";
import React, { useEffect, useState } from "react";
import { useWalletContext } from "@/contexts/WalletContext";
import { MessageSquare } from "lucide-react";

interface Post {
  id: string;
  content: string;
  imageUrl?: string;
  timestamp?: number;
  topic: string;
}

interface Comment {
  id: string;
  postId: string;
  content: string;
  author: string;
  timestamp: number;
}

interface UserPostsProps {
  fetchPostsFromContract: () => void;
  posts: Post[];
}

export const UserPosts = ({ fetchPostsFromContract, posts }: UserPostsProps) => {
  const { isConnected } = useWalletContext();
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [newCommentText, setNewCommentText] = useState<Record<string, string>>({});
  
  // Mock comments data - separado de los posts
  const [mockComments, setMockComments] = useState<Comment[]>([
    {
      id: "comment-1",
      postId: "1", // Este ID debería coincidir con algún post real para pruebas
      content: "Gran publicación! La descentralización es el futuro.",
      author: "0x742...A39B",
      timestamp: Date.now() - 3600000
    },
    {
      id: "comment-2",
      postId: "1",
      content: "Totalmente de acuerdo con esta visión.",
      author: "0x910...F29C",
      timestamp: Date.now() - 1800000
    }
  ]);

  useEffect(() => {
    if (isConnected) {
      fetchPostsFromContract();
    }
  }, [isConnected]);

  // Obtener comentarios para un post específico
  const getCommentsForPost = (postId: string) => {
    return mockComments.filter(comment => comment.postId === postId);
  };

  // Contar comentarios para un post
  const getCommentCount = (postId: string) => {
    return getCommentsForPost(postId).length;
  };

  // Agregar un nuevo comentario (mockup)
  const addComment = (postId: string) => {
    if (!newCommentText[postId]?.trim()) {
      return;
    }
    
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      postId: postId,
      content: newCommentText[postId],
      author: "0x" + Math.random().toString(16).substring(2, 6) + "..." + Math.random().toString(16).substring(2, 6).toUpperCase(),
      timestamp: Date.now()
    };
    
    setMockComments([...mockComments, newComment]);
    
    // Limpiar el campo de entrada
    setNewCommentText({
      ...newCommentText,
      [postId]: ""
    });
  };

  const toggleComments = (postId: string) => {
    setExpandedComments({
      ...expandedComments,
      [postId]: !expandedComments[postId]
    });
  };

  return (
    <div className="terminal-window p-6 rounded-lg flex flex-col items-center">
      <h2 className="text-xl font-mono mb-4 text-center text-[var(--matrix-green)]">
        Latest Posts
      </h2>
      <div className="space-y-6 w-full max-w-2xl">
        {posts.map((post) => (
          <div
            key={post.id}
            className="border-2 border-[var(--matrix-green)] rounded-lg p-6 flex flex-col items-center bg-black shadow-lg"
          >
            {post.imageUrl && (
              <img
                src={post.imageUrl}
                alt="Post image"
                className="w-full max-w-md rounded-md mb-4 border border-[var(--matrix-green)]"
                onError={(e) => {
                  // Fallback en caso de error al cargar la imagen
                  console.error(e);
                }}
              />
            )}
            <p className="text-lg font-semibold text-center text-white mb-2">
              {post.content}
            </p>
            <p className="text-md text-[var(--matrix-green)] italic mb-2">
              {post.topic || "No topic"}
            </p>
            <div className="flex justify-between items-center w-full mt-4">
              <p className="text-sm text-gray-400">
                {post.timestamp
                  ? new Date(post.timestamp).toLocaleString()
                  : "No timestamp"}
              </p>
              <button 
                onClick={() => toggleComments(post.id)}
                className="flex items-center space-x-2 text-[var(--matrix-green)] hover:text-green-400 transition-colors"
              >
                <MessageSquare size={18} />
                <span className="relative">
                  Comments
                  {getCommentCount(post.id) > 0 && (
                    <span className="absolute -top-2 -right-6 bg-[var(--matrix-green)] text-black text-xs px-2 rounded-full">
                      {getCommentCount(post.id)}
                    </span>
                  )}
                </span>
              </button>
            </div>

            {/* Sección de comentarios (expandible) */}
            {expandedComments[post.id] && (
              <div className="mt-4 w-full border-t border-[var(--matrix-green)] pt-4">
                <h3 className="text-[var(--matrix-green)] mb-2 font-mono">Comments</h3>
                
                {/* Lista de comentarios */}
                <div className="space-y-3 mb-4">
                  {getCommentsForPost(post.id).length > 0 ? (
                    getCommentsForPost(post.id).map((comment) => (
                      <div key={comment.id} className="border border-gray-700 rounded p-3 bg-black/60">
                        <p className="text-white text-sm">{comment.content}</p>
                        <div className="flex justify-between mt-2 text-xs">
                          <span className="text-[var(--matrix-green)]">{comment.author}</span>
                          <span className="text-gray-500">
                            {new Date(comment.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm italic">No comments yet. Be the first to comment!</p>
                  )}
                </div>
                
                {/* Formulario para agregar comentarios */}
                <div className="flex mt-2">
                  <input
                    type="text"
                    value={newCommentText[post.id] || ""}
                    onChange={(e) => setNewCommentText({
                      ...newCommentText,
                      [post.id]: e.target.value
                    })}
                    placeholder="Add your comment..."
                    className="flex-grow bg-black border border-[var(--matrix-green)] rounded-l p-2 text-white focus:outline-none focus:ring-1 focus:ring-[var(--matrix-green)]"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addComment(post.id);
                      }
                    }}
                  />
                  <button
                    onClick={() => addComment(post.id)}
                    className="bg-[var(--matrix-green)] text-black px-4 py-2 rounded-r hover:bg-green-400 transition-colors"
                  >
                    Post
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};