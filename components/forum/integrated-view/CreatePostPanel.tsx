"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, Send } from "lucide-react";
import { TopicsDropdown } from "@/components/TopicsDropdown";
import { MatrixEditor } from "./MatrixEditor";
import type { CreatePostPanelProps } from "./types";

/**
 * CreatePostPanel - Form for creating new posts
 */
export const CreatePostPanel: React.FC<CreatePostPanelProps> = ({
  communities,
  selectedCommunityId,
  communityTopics,
  postSelectedTopic,
  newPost,
  selectedImage,
  loading,
  canCurrentUserAddTopics,
  onCommunityChange,
  onTopicChange,
  onContentChange,
  onImageSelect,
  onSubmit,
  onCancel,
  onTopicsUpdate,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-6 text-slate-900 dark:text-slate-100">
        New Post
      </h2>
      <div className="space-y-5">
        {/* Community Selector */}
        <div className="flex flex-col">
          <label className="text-slate-600 dark:text-slate-300 font-medium mb-2 text-sm">
            Community
          </label>
          {selectedCommunityId ? (
            <div className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 p-3 rounded-xl w-full">
              {communities.find((c) => c.id === selectedCommunityId)?.name ||
                `Community #${selectedCommunityId}`}
            </div>
          ) : (
            <select
              value={selectedCommunityId || ""}
              onChange={onCommunityChange}
              className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800"
            >
              <option value="" disabled>Select a community</option>
              {communities.map((community) => (
                <option
                  key={community.id}
                  value={community.id}
                  disabled={!community.isMember && !community.isCreator}
                >
                  {community.name} {community.isMember || community.isCreator ? "" : "(Join first)"}
                </option>
              ))}
            </select>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            You can only create posts in communities you have joined.
          </p>
        </div>

        {/* Topic Selector */}
        {selectedCommunityId && (
          <div className="flex flex-col">
            <label className="text-slate-600 dark:text-slate-300 font-medium mb-2 text-sm">
              Topic
            </label>
            <TopicsDropdown
              onTopicSelect={onTopicChange}
              topics={communityTopics}
              setTopics={onTopicsUpdate}
              disableAddingTopics={!canCurrentUserAddTopics}
              selectedTopic={postSelectedTopic}
            />
          </div>
        )}

        {/* Content Editor */}
        <div className="flex flex-col">
          <label className="text-slate-600 dark:text-slate-300 font-medium mb-2 text-sm">
            Content
          </label>
          <MatrixEditor content={newPost} setContent={onContentChange} />
        </div>

        {/* Image Upload */}
        <div className="flex flex-col">
          <label className="text-slate-600 dark:text-slate-300 font-medium mb-2 text-sm flex items-center">
            <span>Attach Image</span>
            <span className="ml-2 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={onImageSelect}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <ImagePlus className="h-4 w-4 text-slate-400 dark:text-slate-500 hover:text-indigo-500" />
              </label>
            </span>
          </label>
          {selectedImage && (
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 p-3 border border-dashed border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700">
              {selectedImage.name}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end items-center gap-3 pt-4">
          <Button
            onClick={onCancel}
            className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl px-5"
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl px-6 font-medium shadow-md shadow-indigo-200 dark:shadow-indigo-900/50"
            disabled={loading || !postSelectedTopic || !selectedCommunityId}
          >
            {loading ? <span className="animate-pulse">Publishing...</span> : <>Publish <Send className="h-3 w-3 ml-1" /></>}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreatePostPanel;
