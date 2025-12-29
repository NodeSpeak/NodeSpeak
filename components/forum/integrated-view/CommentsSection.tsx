"use client";

import React from "react";
import { MoreVertical, Trash2 } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import type { Comment, CommentsSectionProps } from "./types";

/**
 * CommentsSection - Displays comments list and input for a post
 */
export const CommentsSection: React.FC<CommentsSectionProps> = ({
  postId,
  comments,
  loading,
  newCommentText,
  submitting,
  deletingComment,
  showCommentMenu,
  currentUserAddress,
  onAddComment,
  onCommentTextChange,
  onDeleteComment,
  onToggleCommentMenu,
  formatDate,
  isUserHidden,
}) => {
  const filteredComments = comments
    .filter((c) => !isUserHidden(c.author))
    .sort((a, b) => Number(a.timestamp) - Number(b.timestamp));

  return (
    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700">
      <h3 className="text-slate-600 dark:text-slate-300 mb-4 font-medium text-sm">
        Comments
      </h3>

      {/* Comment input */}
      <div className="flex mb-5 gap-3">
        <input
          type="text"
          value={newCommentText}
          onChange={(e) => onCommentTextChange(e.target.value)}
          placeholder="Write a comment..."
          className="flex-grow bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 focus:border-indigo-400 dark:focus:border-indigo-600 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          onKeyPress={(e) => {
            if (e.key === "Enter") onAddComment();
          }}
          disabled={submitting}
        />
        <button
          onClick={onAddComment}
          className="bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm font-medium"
          disabled={submitting}
        >
          {submitting ? "..." : "Send"}
        </button>
      </div>

      {/* Comments list */}
      <div className="space-y-3 mb-4">
        {loading ? (
          <div className="text-center text-slate-500 dark:text-slate-400">
            Loading comments...
          </div>
        ) : filteredComments.length > 0 ? (
          filteredComments.map((comment) => (
            <div
              key={comment.id}
              className="border border-slate-100 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-700/50"
            >
              <div className="flex items-start">
                <div className="mr-3 flex-shrink-0">
                  <UserAvatar address={comment.author} size="sm" showNickname />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 dark:text-slate-500 text-xs">
                      {formatDate(comment.timestamp)}
                    </span>
                    {comment.author &&
                      currentUserAddress &&
                      comment.author.toLowerCase() ===
                        currentUserAddress.toLowerCase() && (
                        <div className="relative" data-comment-menu>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleCommentMenu(comment.id);
                            }}
                            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-slate-400 dark:text-slate-500"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                          {showCommentMenu[comment.id] && (
                            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-10 min-w-[120px]">
                              <button
                                onClick={() => onDeleteComment(comment)}
                                disabled={deletingComment[comment.id]}
                                className="w-full px-3 py-1.5 text-left text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2 disabled:opacity-50"
                              >
                                <Trash2 className="w-3 h-3" />
                                {deletingComment[comment.id] ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-sm mt-1 break-anywhere">
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-slate-500 dark:text-slate-400 text-sm italic">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  );
};

export default CommentsSection;
