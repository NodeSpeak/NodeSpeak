"use client";

import React from "react";
import { MoreVertical, Trash2 } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { FormattedContent } from "./FormattedContent";
import { CommentsSection } from "./CommentsSection";
import type { Post, Comment } from "./types";

interface PostCardProps {
  post: Post;
  comments: Comment[];
  expandedComments: boolean;
  loadingComments: boolean;
  newCommentText: string;
  submittingComment: boolean;
  userLiked: boolean;
  likingPost: boolean;
  deletingPost: boolean;
  showPostMenu: boolean;
  deletingComment: Record<string, boolean>;
  showCommentMenu: Record<string, boolean>;
  currentUserAddress: string | null;
  communityName: string;
  onToggleComments: () => void;
  onAddComment: () => Promise<void>;
  onCommentTextChange: (text: string) => void;
  onLikePost: () => Promise<void>;
  onDeletePost: () => Promise<void>;
  onTogglePostMenu: () => void;
  onDeleteComment: (comment: Comment) => Promise<void>;
  onToggleCommentMenu: (commentId: string) => void;
  formatDate: (timestamp: number) => string;
  isUserHidden: (address: string) => boolean;
}

/**
 * PostCard - Renders a single post with all interactions
 */
export const PostCard: React.FC<PostCardProps> = ({
  post,
  comments,
  expandedComments,
  loadingComments,
  newCommentText,
  submittingComment,
  userLiked,
  likingPost,
  deletingPost,
  showPostMenu,
  deletingComment,
  showCommentMenu,
  currentUserAddress,
  communityName,
  onToggleComments,
  onAddComment,
  onCommentTextChange,
  onLikePost,
  onDeletePost,
  onTogglePostMenu,
  onDeleteComment,
  onToggleCommentMenu,
  formatDate,
  isUserHidden,
}) => {
  const isAuthor =
    post.author &&
    currentUserAddress &&
    post.author.toLowerCase() === currentUserAddress.toLowerCase();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center mb-2">
          <UserAvatar address={post.author || ""} size="md" showNickname className="mr-3" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
              <span>{formatDate(post.timestamp)}</span>
              <span>•</span>
              <span className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md">
                {post.topic}
              </span>
              <span>•</span>
              <span className="text-slate-500 dark:text-slate-400">{communityName}</span>
            </div>
          </div>
        </div>

        {isAuthor && (
          <div className="relative" data-post-menu>
            <button
              onClick={(e) => { e.stopPropagation(); onTogglePostMenu(); }}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-400 dark:text-slate-500"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {showPostMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-10 min-w-[140px]">
                <button
                  onClick={onDeletePost}
                  disabled={deletingPost}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {deletingPost ? "Deleting..." : "Delete Post"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mt-4">
        <FormattedContent htmlContent={post.content} />
      </div>

      {/* Image */}
      {post.imageUrl && (
        <div className="mt-4 flex justify-center">
          <ImageWithFallback
            cid={post.imageUrl}
            alt="Post attachment"
            className="max-w-full max-h-96 rounded-xl border border-slate-200 dark:border-slate-700 object-contain"
            fallback={<div className="max-w-full h-96 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400">Image unavailable</div>}
          />
        </div>
      )}

      {/* Engagement */}
      <div className="flex items-center mt-5 pt-4 border-t border-slate-100 dark:border-slate-700 gap-4 text-sm text-slate-400 dark:text-slate-500">
        <button
          onClick={onLikePost}
          className={`flex items-center gap-1.5 transition-colors ${userLiked ? "text-rose-500 cursor-default" : "hover:text-rose-500"}`}
          disabled={likingPost}
        >
          <span className={likingPost ? "animate-pulse" : ""}>{likingPost ? "💗" : userLiked ? "❤️" : "🤍"}</span>
          <span>{post.likeCount}</span>
        </button>
        <button onClick={onToggleComments} className="flex items-center gap-1.5 hover:text-indigo-500 transition-colors">
          <span>💬</span>
          <span>{post.commentCount}</span>
        </button>
      </div>

      {/* Comments */}
      {expandedComments && (
        <CommentsSection
          postId={post.id}
          comments={comments}
          loading={loadingComments}
          newCommentText={newCommentText}
          submitting={submittingComment}
          deletingComment={deletingComment}
          showCommentMenu={showCommentMenu}
          currentUserAddress={currentUserAddress}
          onAddComment={onAddComment}
          onCommentTextChange={onCommentTextChange}
          onDeleteComment={onDeleteComment}
          onToggleCommentMenu={onToggleCommentMenu}
          formatDate={formatDate}
          isUserHidden={isUserHidden}
        />
      )}
    </div>
  );
};

export default PostCard;
