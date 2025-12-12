"use client";

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Skeleton para el header del perfil de usuario
 */
export function ProfileHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-fadeIn", className)}>
      {/* Cover Image Skeleton */}
      <div className="relative h-48 sm:h-64 bg-slate-200 dark:bg-slate-700 animate-pulse rounded-t-2xl" />

      <div className="px-4 sm:px-8 pb-6">
        {/* Avatar overlap */}
        <div className="relative -mt-16 sm:-mt-20 mb-4">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse border-4 border-white dark:border-slate-900" />
        </div>

        {/* Name and stats */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <div className="h-4 w-full max-w-2xl bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-4 w-3/4 max-w-xl bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>

          {/* Stats */}
          <div className="flex gap-6">
            <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <div className="h-9 w-24 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
            <div className="h-9 w-24 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton para activity item en el perfil
 */
export function ActivityItemSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("p-4 border-b border-slate-200 dark:border-slate-700", className)}>
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse flex-shrink-0" />

        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton para lista de actividad reciente
 */
export function RecentActivitySkeleton({ count = 5, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-fadeIn", className)}>
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      </div>

      <div>
        {Array.from({ length: count }).map((_, index) => (
          <ActivityItemSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton para card de comunidad en perfil
 */
export function CommunityBadgeSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 p-3 bg-white/80 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700", className)}>
      <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Skeleton para grid de comunidades en perfil
 */
export function UserCommunitiesSkeleton({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("space-y-3 animate-fadeIn", className)}>
      <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: count }).map((_, index) => (
          <CommunityBadgeSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton completo para la página de perfil
 */
export function ProfilePageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 animate-fadeIn", className)}>
      <ProfileHeaderSkeleton />

      <div className="px-4 sm:px-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <RecentActivitySkeleton count={5} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <UserCommunitiesSkeleton count={3} />
          </div>
        </div>
      </div>
    </div>
  );
}
