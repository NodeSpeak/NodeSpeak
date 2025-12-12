"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import {
  ActivityLoadingSkeleton,
  CommunitySkeleton,
  CommunityCardSkeleton,
  CommunityGridSkeleton,
  PostSkeleton,
} from './skeletons/PostSkeleton';
import {
  ForumCommunityListSkeleton,
  ForumPostsSkeleton,
} from './skeletons/ForumSkeleton';
import {
  ProfilePageSkeleton,
  ProfileHeaderSkeleton,
  RecentActivitySkeleton,
  UserCommunitiesSkeleton,
  ActivityItemSkeleton,
} from './skeletons/ProfileSkeleton';
import {
  AdminDashboardSkeleton,
  AdminPanelSkeleton,
  StatCardSkeleton,
  TableRowSkeleton,
} from './skeletons/AdminSkeleton';

type LoadingType =
  | 'activity'
  | 'community'
  | 'community-card'
  | 'community-grid'
  | 'post'
  | 'forum-community-list'
  | 'forum-posts'
  | 'profile'
  | 'profile-header'
  | 'recent-activity'
  | 'user-communities'
  | 'activity-item'
  | 'admin-dashboard'
  | 'admin-panel'
  | 'stat-card'
  | 'table-row';

interface LoadingProps {
  /** Tipo de skeleton a mostrar */
  type: LoadingType;
  /** Número de items (cuando aplica) */
  count?: number;
  /** Clase CSS personalizada */
  className?: string;
}

/**
 * Componente Loading unificado para todo el proyecto
 *
 * Centraliza todos los skeletons en un solo componente reutilizable
 *
 * @example
 * ```tsx
 * {isLoading ? (
 *   <Loading type="activity" count={3} />
 * ) : (
 *   <ActivityContent data={data} />
 * )}
 * ```
 */
export function Loading({ type, count, className }: LoadingProps) {
  switch (type) {
    // Activity & Communities
    case 'activity':
      return <ActivityLoadingSkeleton communityCount={count || 3} className={className} />;
    case 'community':
      return <CommunitySkeleton postCount={count || 3} className={className} />;
    case 'community-card':
      return <CommunityCardSkeleton className={className} />;
    case 'community-grid':
      return <CommunityGridSkeleton count={count || 6} className={className} />;
    case 'post':
      return <PostSkeleton className={className} />;
    case 'forum-community-list':
      return <ForumCommunityListSkeleton count={count || 3} className={className} />;
    case 'forum-posts':
      return <ForumPostsSkeleton postCount={count || 4} className={className} />;

    // Profile
    case 'profile':
      return <ProfilePageSkeleton className={className} />;
    case 'profile-header':
      return <ProfileHeaderSkeleton className={className} />;
    case 'recent-activity':
      return <RecentActivitySkeleton count={count || 5} className={className} />;
    case 'user-communities':
      return <UserCommunitiesSkeleton count={count || 3} className={className} />;
    case 'activity-item':
      return <ActivityItemSkeleton className={className} />;

    // Admin
    case 'admin-dashboard':
      return <AdminDashboardSkeleton className={className} />;
    case 'admin-panel':
      return <AdminPanelSkeleton rows={count || 5} className={className} />;
    case 'stat-card':
      return <StatCardSkeleton className={className} />;
    case 'table-row':
      return <TableRowSkeleton className={className} />;

    default:
      return null;
  }
}

/**
 * Componente para contenido con loading state
 * Simplifica el patrón condicional isLoading ? skeleton : content
 *
 * @example
 * ```tsx
 * <LoadingWrapper
 *   isLoading={isLoading}
 *   skeleton={<Loading type="activity" />}
 * >
 *   <ActivityContent data={data} />
 * </LoadingWrapper>
 * ```
 */
interface LoadingWrapperProps {
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function LoadingWrapper({ isLoading, skeleton, children, className }: LoadingWrapperProps) {
  if (isLoading) {
    return <div className={className}>{skeleton}</div>;
  }

  return <div className={cn("animate-fadeIn", className)}>{children}</div>;
}
