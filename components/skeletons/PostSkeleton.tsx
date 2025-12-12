"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface PostSkeletonProps {
  /** Mostrar imagen en el skeleton */
  showImage?: boolean;
  /** Clase CSS personalizada */
  className?: string;
}

/**
 * Skeleton para un post individual en el feed
 * Simula la estructura visual de un post real
 */
export function PostSkeleton({ showImage = false, className }: PostSkeletonProps) {
  return (
    <div className={cn("px-4 sm:px-6 py-4 sm:py-5", className)}>
      <div className="flex gap-3 sm:gap-4">
        {/* Avatar skeleton */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
        </div>

        {/* Content skeleton */}
        <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
          {/* Header: autor, topic, timestamp */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="h-3.5 sm:h-4 w-20 sm:w-24 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
            <div className="h-4 sm:h-5 w-14 sm:w-16 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
            <div className="h-3 w-12 sm:w-16 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse ml-auto" />
          </div>

          {/* Content lines */}
          <div className="space-y-1.5 sm:space-y-2">
            <div className="h-3.5 sm:h-4 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-3.5 sm:h-4 w-5/6 sm:w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>

          {/* Image skeleton (conditional) */}
          {showImage && (
            <div className="w-full max-w-md h-32 sm:h-48 rounded-lg sm:rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
          )}

          {/* Footer: stats */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-3.5 sm:h-4 w-10 sm:w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-3.5 sm:h-4 w-10 sm:w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface CommunitySkeletonProps {
  /** Número de posts a mostrar */
  postCount?: number;
  /** Clase CSS personalizada */
  className?: string;
}

/**
 * Skeleton para una comunidad completa con sus posts
 */
export function CommunitySkeleton({ postCount = 3, className }: CommunitySkeletonProps) {
  return (
    <div className={cn(
      "bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl shadow-slate-200/40 dark:shadow-slate-900/40 border border-white/60 dark:border-slate-700 overflow-hidden",
      className
    )}>
      {/* Community Header skeleton */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-slate-50/80 dark:from-slate-700/50 to-transparent">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            {/* Community photo */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse flex-shrink-0" />

            {/* Community info */}
            <div className="space-y-1.5 sm:space-y-2 flex-1 min-w-0">
              <div className="h-4 sm:h-5 w-24 sm:w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-3 sm:h-4 w-20 sm:w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-3 sm:h-4 w-16 sm:w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Action button skeleton */}
          <div className="h-7 w-16 sm:h-8 sm:w-20 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse flex-shrink-0" />
        </div>
      </div>

      {/* Posts skeleton */}
      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {Array.from({ length: postCount }).map((_, index) => (
          <PostSkeleton
            key={index}
            showImage={index === 0} // Solo el primer post muestra imagen
          />
        ))}
      </div>
    </div>
  );
}

interface ActivityLoadingSkeletonProps {
  /** Número de comunidades a mostrar */
  communityCount?: number;
  /** Clase CSS personalizada */
  className?: string;
}

/**
 * Skeleton completo para la página de Activity
 * Muestra múltiples comunidades con sus posts
 */
export function ActivityLoadingSkeleton({
  communityCount = 3,
  className
}: ActivityLoadingSkeletonProps) {
  return (
    <div className={cn("space-y-8 animate-fadeIn", className)}>
      {Array.from({ length: communityCount }).map((_, index) => (
        <CommunitySkeleton
          key={index}
          postCount={index === 0 ? 5 : 3} // Primera comunidad con más posts
        />
      ))}
    </div>
  );
}

/**
 * Skeleton para lista de comunidades (sin posts)
 * Usado en /foro cuando se lista solo comunidades
 */
export function CommunityCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-lg border border-white/60 dark:border-slate-700 p-4 sm:p-6",
      className
    )}>
      <div className="flex items-start gap-4">
        {/* Community photo */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse flex-shrink-0" />

        <div className="flex-1 min-w-0 space-y-3">
          {/* Title */}
          <div className="h-6 w-2/3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />

          {/* Description */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-4 w-4/5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4">
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        </div>

        {/* Action button */}
        <div className="h-9 w-20 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse flex-shrink-0" />
      </div>
    </div>
  );
}

/**
 * Skeleton para grid de comunidades
 */
export function CommunityGridSkeleton({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-fadeIn", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <CommunityCardSkeleton key={index} />
      ))}
    </div>
  );
}
