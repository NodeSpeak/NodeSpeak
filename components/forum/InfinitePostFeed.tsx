"use client";

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Heart, MessageSquare, MoreVertical, Trash2, Send, Clock } from 'lucide-react';
import DOMPurify from 'dompurify';
import { UserAvatar } from '@/components/UserAvatar';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { AddressText } from '@/components/AddressDisplay';
import { useInfiniteCommunityPosts, useInfiniteAllPosts, useLikePost, useComments, useAddComment, useUserPostLikes } from '@/hooks/queries';
import { useWalletContext } from '@/contexts/WalletContext';
import { toast } from 'sonner';
import type { Post } from '@/types/forum';

interface InfinitePostFeedProps {
    communityId?: string | null;
    onTopicClick?: (topic: string) => void;
    containerHeight?: string;
}

export const InfinitePostFeed: React.FC<InfinitePostFeedProps> = ({
    communityId,
    onTopicClick,
    containerHeight = 'calc(100vh - 300px)',
}) => {
    const { address } = useWalletContext();
    const parentRef = useRef<HTMLDivElement>(null);
    
    // Use infinite query based on whether communityId is provided
    const infiniteQuery = communityId 
        ? useInfiniteCommunityPosts(communityId, 10)
        : useInfiniteAllPosts(15);

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = infiniteQuery;

    // Flatten pages into single array
    const allPosts = data?.pages.flatMap(page => page.posts) ?? [];
    
    // Get user likes for visible posts
    const postIds = allPosts.map(p => p.id);
    const { data: userLikes = {} } = useUserPostLikes(postIds);

    // Like mutation
    const likeMutation = useLikePost();

    // Local state for UI
    const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
    const [commentText, setCommentText] = useState<Record<string, string>>({});
    const [showPostMenu, setShowPostMenu] = useState<Record<string, boolean>>({});

    // Virtualizer
    const virtualizer = useVirtualizer({
        count: hasNextPage ? allPosts.length + 1 : allPosts.length,
        getScrollElement: () => parentRef.current,
        estimateSize: (index) => {
            if (index >= allPosts.length) return 100; // Load more button
            const post = allPosts[index];
            let height = 200; // Base height
            if (post.imageUrl) height += 200;
            if (expandedComments[post.id]) height += 300;
            return height;
        },
        overscan: 3,
        gap: 16,
    });

    // Load more when reaching the end
    useEffect(() => {
        const lastItem = virtualizer.getVirtualItems().at(-1);
        if (!lastItem) return;
        
        if (lastItem.index >= allPosts.length - 1 && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [virtualizer.getVirtualItems(), hasNextPage, isFetchingNextPage, allPosts.length, fetchNextPage]);

    const formatTimestamp = (timestamp: number) => {
        const now = Date.now() / 1000;
        const diff = now - timestamp;
        if (diff < 60) return "Just now";
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
        return new Date(timestamp * 1000).toLocaleDateString();
    };

    const handleLike = async (postId: string) => {
        if (!address) {
            toast.error("Connect wallet to like posts");
            return;
        }
        if (userLikes[postId]) {
            toast.info("You already liked this post");
            return;
        }
        try {
            await likeMutation.mutateAsync(postId);
        } catch (error) {
            toast.error("Failed to like post");
        }
    };

    const toggleComments = (postId: string) => {
        setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 animate-pulse">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full" />
                            <div className="flex-1 space-y-3">
                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (allPosts.length === 0) {
        return (
            <div className="text-center py-16 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <p className="text-slate-500 dark:text-slate-400 font-medium">No posts yet</p>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Be the first to post!</p>
            </div>
        );
    }

    return (
        <div
            ref={parentRef}
            className="overflow-auto"
            style={{ height: containerHeight }}
        >
            <div
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {virtualizer.getVirtualItems().map((virtualItem) => {
                    const isLoaderRow = virtualItem.index >= allPosts.length;

                    if (isLoaderRow) {
                        return (
                            <div
                                key="loader"
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    transform: `translateY(${virtualItem.start}px)`,
                                }}
                                className="flex justify-center py-4"
                            >
                                {isFetchingNextPage ? (
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <div className="w-5 h-5 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
                                        Loading more...
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => fetchNextPage()}
                                        className="px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                    >
                                        Load more
                                    </button>
                                )}
                            </div>
                        );
                    }

                    const post = allPosts[virtualItem.index];
                    const isLiked = userLikes[post.id];
                    const isExpanded = expandedComments[post.id];

                    return (
                        <div
                            key={post.id}
                            data-index={virtualItem.index}
                            ref={virtualizer.measureElement}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                transform: `translateY(${virtualItem.start}px)`,
                            }}
                        >
                            <PostItem
                                post={post}
                                isLiked={isLiked}
                                isExpanded={isExpanded}
                                onLike={() => handleLike(post.id)}
                                onToggleComments={() => toggleComments(post.id)}
                                onTopicClick={onTopicClick}
                                formatTimestamp={formatTimestamp}
                                currentUserAddress={address}
                                commentText={commentText[post.id] || ''}
                                onCommentTextChange={(text) => setCommentText(prev => ({ ...prev, [post.id]: text }))}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

interface PostItemProps {
    post: Post;
    isLiked: boolean;
    isExpanded: boolean;
    onLike: () => void;
    onToggleComments: () => void;
    onTopicClick?: (topic: string) => void;
    formatTimestamp: (timestamp: number) => string;
    currentUserAddress: string | null;
    commentText: string;
    onCommentTextChange: (text: string) => void;
}

const PostItem: React.FC<PostItemProps> = ({
    post,
    isLiked,
    isExpanded,
    onLike,
    onToggleComments,
    onTopicClick,
    formatTimestamp,
    currentUserAddress,
    commentText,
    onCommentTextChange,
}) => {
    const { data: comments = [], isLoading: loadingComments } = useComments(isExpanded ? post.id : null);
    const addCommentMutation = useAddComment();

    const handleAddComment = async () => {
        if (!commentText.trim() || !currentUserAddress) return;
        try {
            await addCommentMutation.mutateAsync({
                postId: post.id,
                content: commentText.trim(),
            });
            onCommentTextChange('');
            toast.success("Comment added!");
        } catch (error) {
            toast.error("Failed to add comment");
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Post Header */}
            <div className="p-5 pb-3">
                <div className="flex items-start gap-3">
                    {post.author && <UserAvatar address={post.author} size="md" />}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            {post.author && (
                                <AddressText
                                    address={post.author}
                                    className="text-sm font-medium text-slate-900 dark:text-slate-100"
                                />
                            )}
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTimestamp(post.timestamp)}
                            </span>
                            {post.topic && (
                                <button
                                    onClick={() => onTopicClick?.(post.topic)}
                                    className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                                >
                                    {post.topic}
                                </button>
                            )}
                        </div>
                        {post.title && (
                            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-1">
                                {post.title}
                            </h3>
                        )}
                    </div>
                </div>

                {/* Post Content */}
                <div
                    className="mt-3 text-sm text-slate-700 dark:text-slate-300 prose prose-sm dark:prose-invert max-w-none"
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
                            className="w-full max-h-80 object-cover"
                            fallback={<div className="w-full h-48 bg-slate-100 dark:bg-slate-700" />}
                        />
                    </div>
                </div>
            )}

            {/* Post Actions */}
            <div className="px-5 py-3 flex items-center gap-4 border-t border-slate-100 dark:border-slate-700 mt-3">
                <button
                    onClick={onLike}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${
                        isLiked ? "text-red-500" : "text-slate-500 hover:text-red-500"
                    }`}
                >
                    <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
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
                                value={commentText}
                                onChange={(e) => onCommentTextChange(e.target.value)}
                                placeholder="Write a comment..."
                                className="flex-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleAddComment();
                                    }
                                }}
                            />
                            <button
                                onClick={handleAddComment}
                                disabled={addCommentMutation.isPending || !commentText.trim()}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Comments List */}
                    <div className="max-h-60 overflow-y-auto">
                        {loadingComments ? (
                            <div className="p-4 text-center text-slate-400 text-sm">Loading...</div>
                        ) : comments.length === 0 ? (
                            <div className="p-4 text-center text-slate-400 text-sm">No comments yet</div>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment.id} className="p-4 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
                                    <div className="flex items-start gap-3">
                                        <UserAvatar address={comment.author} size="sm" />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <AddressText address={comment.author} className="text-sm font-medium" />
                                                <span className="text-xs text-slate-400">{formatTimestamp(comment.timestamp)}</span>
                                            </div>
                                            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{comment.content}</p>
                                        </div>
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
