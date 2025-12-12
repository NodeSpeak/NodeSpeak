"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { PostSkeleton } from "./PostSkeleton";

interface ForumCommunityListSkeletonProps {
  count?: number;
  className?: string;
}

export function ForumCommunityListSkeleton({
  count = 3,
  className,
}: ForumCommunityListSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm"
        >
          <div className="relative h-40">
            <div className="w-full h-full bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 animate-pulse" />
            <div className="absolute top-4 right-4 h-8 w-24 rounded-full bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-600 animate-pulse" />
            <div className="absolute -bottom-8 left-6 flex items-end gap-4">
              <div className="w-16 h-16 rounded-2xl border-4 border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="space-y-2">
                <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-4 w-56 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              </div>
            </div>
          </div>
          <div className="px-6 pt-10 pb-6 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {Array.from({ length: 4 }).map((_, pillIdx) => (
                <div
                  key={pillIdx}
                  className="h-7 w-20 rounded-lg bg-slate-100 dark:bg-slate-700 animate-pulse"
                />
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div className="h-4 w-24 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-4 w-20 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface ForumPostsSkeletonProps {
  postCount?: number;
  className?: string;
}

export function ForumPostsSkeleton({
  postCount = 4,
  className,
}: ForumPostsSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
        <div className="h-44 bg-slate-100 dark:bg-slate-700 animate-pulse" />
        <div className="flex items-end gap-4 px-6 -mt-10 pb-6">
          <div className="w-24 h-24 rounded-2xl border-4 border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        </div>
      </div>

      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm space-y-4">
        <div className="flex flex-wrap gap-2">
          <div className="h-8 w-16 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 animate-pulse" />
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="h-8 w-20 rounded-lg bg-slate-100 dark:bg-slate-700 animate-pulse"
            />
          ))}
        </div>
        <div className="h-9 w-32 rounded-full bg-slate-100 dark:bg-slate-700 animate-pulse" />
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/40 backdrop-blur shadow-sm">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {Array.from({ length: postCount }).map((_, idx) => (
            <PostSkeleton key={idx} showImage={idx === 0} className="px-6" />
          ))}
        </div>
      </div>
    </div>
  );
}
