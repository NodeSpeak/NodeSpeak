"use client";

import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { PostCard } from './PostCard';

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

interface VirtualizedPostListProps {
    posts: Post[];
    comments: Record<string, Comment[]>;
    expandedComments: Record<string, boolean>;
    onToggleComments: (postId: string) => void;
    onLikePost: (postId: string) => void;
    onDeletePost: (postId: string, author: string) => void;
    onAddComment: (postId: string) => void;
    onDeleteComment: (comment: Comment) => void;
    newCommentText: Record<string, string>;
    onCommentTextChange: (postId: string, text: string) => void;
    likingPost: Record<string, boolean>;
    deletingPost: Record<string, boolean>;
    submittingComment: Record<string, boolean>;
    deletingComment: Record<string, boolean>;
    userLikedPosts: Record<string, boolean>;
    currentUserAddress: string | null;
    showPostMenu: Record<string, boolean>;
    onTogglePostMenu: (postId: string) => void;
    showCommentMenu: Record<string, boolean>;
    onToggleCommentMenu: (commentId: string) => void;
    loadingComments: Record<string, boolean>;
    formatTimestamp: (timestamp: number) => string;
    onTopicClick: (e: React.MouseEvent, topic: string) => void;
    containerHeight?: string;
    estimatedItemHeight?: number;
}

export const VirtualizedPostList: React.FC<VirtualizedPostListProps> = ({
    posts,
    comments,
    expandedComments,
    onToggleComments,
    onLikePost,
    onDeletePost,
    onAddComment,
    onDeleteComment,
    newCommentText,
    onCommentTextChange,
    likingPost,
    deletingPost,
    submittingComment,
    deletingComment,
    userLikedPosts,
    currentUserAddress,
    showPostMenu,
    onTogglePostMenu,
    showCommentMenu,
    onToggleCommentMenu,
    loadingComments,
    formatTimestamp,
    onTopicClick,
    containerHeight = 'calc(100vh - 300px)',
    estimatedItemHeight = 350,
}) => {
    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: posts.length,
        getScrollElement: () => parentRef.current,
        estimateSize: (index) => {
            const post = posts[index];
            const isExpanded = expandedComments[post.id];
            const commentCount = comments[post.id]?.length || 0;
            
            // Base height + expanded comments height
            let height = estimatedItemHeight;
            if (isExpanded) {
                height += Math.min(commentCount * 80, 320) + 80; // Comments + input
            }
            if (post.imageUrl) {
                height += 200; // Image height
            }
            return height;
        },
        overscan: 3,
        gap: 24,
    });

    const virtualItems = virtualizer.getVirtualItems();

    if (posts.length === 0) {
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
            style={{ 
                height: containerHeight,
                contain: 'strict',
            }}
        >
            <div
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {virtualItems.map((virtualItem) => {
                    const post = posts[virtualItem.index];
                    return (
                        <div
                            key={virtualItem.key}
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
                            <PostCard
                                post={post}
                                comments={comments[post.id] || []}
                                isExpanded={expandedComments[post.id] || false}
                                onToggleComments={() => onToggleComments(post.id)}
                                onLikePost={onLikePost}
                                onDeletePost={onDeletePost}
                                onAddComment={onAddComment}
                                onDeleteComment={onDeleteComment}
                                newCommentText={newCommentText[post.id] || ''}
                                onCommentTextChange={(text) => onCommentTextChange(post.id, text)}
                                isLiking={likingPost[post.id] || false}
                                isDeleting={deletingPost[post.id] || false}
                                isSubmittingComment={submittingComment[post.id] || false}
                                isDeletingComment={deletingComment}
                                userLiked={userLikedPosts[post.id] || false}
                                currentUserAddress={currentUserAddress}
                                showPostMenu={showPostMenu[post.id] || false}
                                onTogglePostMenu={() => onTogglePostMenu(post.id)}
                                showCommentMenu={showCommentMenu}
                                onToggleCommentMenu={onToggleCommentMenu}
                                loadingComments={loadingComments[post.id] || false}
                                formatTimestamp={formatTimestamp}
                                onTopicClick={onTopicClick}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
