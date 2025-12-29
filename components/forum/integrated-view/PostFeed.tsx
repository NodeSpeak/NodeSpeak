"use client";

import React from "react";
import { PostCard } from "./PostCard";
import type { PostFeedProps } from "./types";

/**
 * PostFeed - Renders a list of posts with their comments
 */
export const PostFeed: React.FC<PostFeedProps> = ({
  posts,
  comments,
  expandedComments,
  loadingComments,
  newCommentText,
  submittingComment,
  userLikedPosts,
  likingPost,
  deletingPost,
  showPostMenu,
  deletingComment,
  showCommentMenu,
  currentUserAddress,
  selectedCommunityId,
  selectedTopic,
  localCommunities,
  onToggleComments,
  onAddComment,
  onCommentTextChange,
  onLikePost,
  onDeletePost,
  onTogglePostMenu,
  onDeleteComment,
  onToggleCommentMenu,
  getCommunityName,
  formatDate,
  isUserHidden,
}) => {
  if (posts.length === 0) {
    return (
      <div className="p-8 text-center bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <p className="text-slate-700 dark:text-slate-300 mb-2 font-medium">
          No posts found with the current filters.
        </p>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          {selectedTopic
            ? `There are no posts with the topic "${selectedTopic}".`
            : selectedCommunityId
            ? "This community doesn't have any posts yet."
            : "None of your communities have posts yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          comments={comments[post.id] || []}
          expandedComments={expandedComments[post.id] || false}
          loadingComments={loadingComments[post.id] || false}
          newCommentText={newCommentText[post.id] || ""}
          submittingComment={submittingComment[post.id] || false}
          userLiked={userLikedPosts[post.id] || false}
          likingPost={likingPost[post.id] || false}
          deletingPost={deletingPost[post.id] || false}
          showPostMenu={showPostMenu[post.id] || false}
          deletingComment={deletingComment}
          showCommentMenu={showCommentMenu}
          currentUserAddress={currentUserAddress}
          communityName={getCommunityName(post.communityId)}
          onToggleComments={() => onToggleComments(post.id)}
          onAddComment={() => onAddComment(post.id)}
          onCommentTextChange={(text) => onCommentTextChange(post.id, text)}
          onLikePost={() => onLikePost(post.id)}
          onDeletePost={() => onDeletePost(post.id, post.author || "")}
          onTogglePostMenu={() => onTogglePostMenu(post.id)}
          onDeleteComment={onDeleteComment}
          onToggleCommentMenu={onToggleCommentMenu}
          formatDate={formatDate}
          isUserHidden={isUserHidden}
        />
      ))}
    </div>
  );
};

export default PostFeed;
