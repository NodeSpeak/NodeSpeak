"use client";

import React, { useState } from "react";
import { Heart, MessageSquare, MoreVertical, Trash2, Send } from "lucide-react";
import DOMPurify from 'dompurify';
import { UserAvatar } from "@/components/UserAvatar";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { AddressText } from "@/components/AddressDisplay";

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
    index: number;
    postId: string;
    author: string;
    content: string;
    timestamp: number;
    isActive: boolean;
    likeCount?: number;
}

interface PostCardProps {
    post: Post;
    comments: Comment[];
    isExpanded: boolean;
    onToggleComments: () => void;
    onLikePost: (postId: string) => void;
    onDeletePost: (postId: string, author: string) => void;
    onAddComment: (postId: string) => void;
    onDeleteComment: (comment: Comment) => void;
    newCommentText: string;
    onCommentTextChange: (text: string) => void;
    isLiking: boolean;
    isDeleting: boolean;
    isSubmittingComment: boolean;
    isDeletingComment: Record<string, boolean>;
    userLiked: boolean;
    currentUserAddress: string | null;
    showPostMenu: boolean;
    onTogglePostMenu: () => void;
    showCommentMenu: Record<string, boolean>;
    onToggleCommentMenu: (commentId: string) => void;
    loadingComments: boolean;
    formatTimestamp: (timestamp: number) => string;
    onTopicClick: (e: React.MouseEvent, topic: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
    post,
    comments,
    isExpanded,
    onToggleComments,
    onLikePost,
    onDeletePost,
    onAddComment,
    onDeleteComment,
    newCommentText,
    onCommentTextChange,
    isLiking,
    isDeleting,
    isSubmittingComment,
    isDeletingComment,
    userLiked,
    currentUserAddress,
    showPostMenu,
    onTogglePostMenu,
    showCommentMenu,
    onToggleCommentMenu,
    loadingComments,
    formatTimestamp,
    onTopicClick,
}) => {
    const isAuthor = currentUserAddress && post.author?.toLowerCase() === currentUserAddress.toLowerCase();

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow">
            {/* Post Header */}
            <div className="p-5 pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        {post.author && (
                            <UserAvatar address={post.author} size="md" />
                        )}
                        <div>
                            <div className="flex items-center gap-2">
                                {post.author && (
                                    <AddressText 
                                        value={post.author} 
                                        className="text-sm font-medium text-slate-900 dark:text-slate-100"
                                    />
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                                <span>{formatTimestamp(post.timestamp)}</span>
                                {post.topic && (
                                    <>
                                        <span>•</span>
                                        <button
                                            onClick={(e) => onTopicClick(e, post.topic)}
                                            className="hover:text-indigo-500 transition-colors"
                                        >
                                            {post.topic}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Post Menu */}
                    {isAuthor && (
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onTogglePostMenu();
                                }}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <MoreVertical className="w-4 h-4 text-slate-400" />
                            </button>
                            {showPostMenu && (
                                <div className="absolute right-0 top-8 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-10 min-w-[120px]">
                                    <button
                                        onClick={() => onDeletePost(post.id, post.author || '')}
                                        disabled={isDeleting}
                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        {isDeleting ? "Deleting..." : "Delete"}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Post Title */}
                {post.title && (
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-3">
                        {post.title}
                    </h3>
                )}

                {/* Post Content */}
                <div
                    className="mt-2 text-slate-700 dark:text-slate-300 text-sm prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
                />
            </div>

            {/* Post Image */}
            {post.imageUrl && (
                <div className="px-5">
                    <div className="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700">
                        <ImageWithFallback
                            cid={post.imageUrl}
                            alt="Post image"
                            className="w-full max-h-96 object-cover"
                            fallback={<div className="w-full h-48 bg-slate-100 dark:bg-slate-700" />}
                        />
                    </div>
                </div>
            )}

            {/* Post Actions */}
            <div className="px-5 py-3 flex items-center gap-4 border-t border-slate-100 dark:border-slate-700 mt-3">
                <button
                    onClick={() => onLikePost(post.id)}
                    disabled={isLiking}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${
                        userLiked
                            ? "text-red-500"
                            : "text-slate-500 hover:text-red-500"
                    }`}
                >
                    <Heart className={`w-4 h-4 ${userLiked ? "fill-current" : ""}`} />
                    <span>{post.likeCount}</span>
                </button>

                <button
                    onClick={onToggleComments}
                    className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-500 transition-colors"
                >
                    <MessageSquare className="w-4 h-4" />
                    <span>{post.commentCount}</span>
                </button>
            </div>

            {/* Comments Section */}
            {isExpanded && (
                <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    {/* Comment Input */}
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={newCommentText}
                                onChange={(e) => onCommentTextChange(e.target.value)}
                                placeholder="Write a comment..."
                                className="flex-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 focus:border-indigo-400"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        onAddComment(post.id);
                                    }
                                }}
                            />
                            <button
                                onClick={() => onAddComment(post.id)}
                                disabled={isSubmittingComment || !newCommentText.trim()}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isSubmittingComment ? (
                                    <span className="animate-pulse">...</span>
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Comments List */}
                    <div className="max-h-80 overflow-y-auto">
                        {loadingComments ? (
                            <div className="p-4 text-center text-slate-400 text-sm">
                                Loading comments...
                            </div>
                        ) : comments.length === 0 ? (
                            <div className="p-4 text-center text-slate-400 text-sm">
                                No comments yet. Be the first to comment!
                            </div>
                        ) : (
                            comments.map((comment) => (
                                <div
                                    key={comment.id}
                                    className="p-4 border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                            <UserAvatar address={comment.author} size="sm" />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <AddressText
                                                        value={comment.author}
                                                        className="text-sm font-medium text-slate-900 dark:text-slate-100"
                                                    />
                                                    <span className="text-xs text-slate-400">
                                                        {formatTimestamp(comment.timestamp)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                                                    {comment.content}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Comment Menu */}
                                        {currentUserAddress && comment.author.toLowerCase() === currentUserAddress.toLowerCase() && (
                                            <div className="relative">
                                                <button
                                                    onClick={() => onToggleCommentMenu(comment.id)}
                                                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                                >
                                                    <MoreVertical className="w-3 h-3 text-slate-400" />
                                                </button>
                                                {showCommentMenu[comment.id] && (
                                                    <div className="absolute right-0 top-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-10">
                                                        <button
                                                            onClick={() => onDeleteComment(comment)}
                                                            disabled={isDeletingComment[comment.id]}
                                                            className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-1.5"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                            {isDeletingComment[comment.id] ? "..." : "Delete"}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
