"use client";

import React from 'react';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { useCommunities } from '@/hooks/queries/useCommunities';
import { getImageUrl } from '@/lib/ipfsClient';
import { cn } from '@/lib/utils';
import Image from 'next/image';

/**
 * Skeleton para item de comunidad en preview (solo foto)
 */
function CommunityPreviewItemSkeleton() {
  return (
    <div className="aspect-square rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
  );
}

/**
 * Skeleton para sección completa de preview
 */
function CommunityPreviewSkeleton() {
  return (
    <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/40 dark:shadow-slate-900/40 border border-white/60 dark:border-slate-700/60 p-6 overflow-hidden animate-fadeIn">
      {/* Decorative accent */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-400 via-purple-500 to-pink-500" />

      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-900/50 dark:to-violet-800/50 flex items-center justify-center">
          <Users className="w-4 h-4 text-violet-600 dark:text-violet-400" />
        </div>
        <p className="text-sm font-bold tracking-wide text-slate-800 dark:text-slate-200 uppercase">
          Communities
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {Array.from({ length: 3 }).map((_, index) => (
          <CommunityPreviewItemSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

/**
 * Item individual de comunidad en preview (solo foto cuadrada)
 */
interface CommunityPreviewItemProps {
  id: string;
  name: string;
  photo?: string;
}

function CommunityPreviewItem({ id, name, photo }: CommunityPreviewItemProps) {
  const imageUrl = photo ? getImageUrl(photo) : '';

  return (
    <Link
      href={`/foro?community=${id}`}
      className="group relative aspect-square rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 hover:ring-2 hover:ring-violet-400 dark:hover:ring-violet-500 hover:ring-offset-2 dark:hover:ring-offset-slate-800 transition-all duration-300 hover:scale-105"
      title={name}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover"
          unoptimized
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-900/50 dark:to-violet-800/50">
          <Users className="w-8 h-8 text-violet-600 dark:text-violet-400" />
        </div>
      )}

      {/* Hover overlay with name */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <p className="text-white text-xs font-semibold truncate drop-shadow-lg">
            {name}
          </p>
        </div>
      </div>
    </Link>
  );
}

/**
 * Componente de vista previa de comunidades para la landing page
 * Muestra las primeras 6 comunidades activas en grid de 3 columnas
 */
export function CommunityPreview() {
  const { data: communities, isLoading } = useCommunities();

  // Show skeleton while loading
  if (isLoading) {
    return <CommunityPreviewSkeleton />;
  }

  // Don't render if no communities
  if (!communities || communities.length === 0) {
    return null;
  }

  // Show first 3 communities
  const displayCommunities = communities.slice(0, 3);

  return (
    <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/40 dark:shadow-slate-900/40 border border-white/60 dark:border-slate-700/60 p-6 overflow-hidden animate-fadeIn">
      {/* Decorative accent */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-400 via-purple-500 to-pink-500" />

      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-900/50 dark:to-violet-800/50 flex items-center justify-center">
          <Users className="w-4 h-4 text-violet-600 dark:text-violet-400" />
        </div>
        <p className="text-sm font-bold tracking-wide text-slate-800 dark:text-slate-200 uppercase">
          Communities
        </p>
      </div>

      {/* Grid de fotos 3x2 */}
      <div className="grid grid-cols-3 gap-2.5">
        {displayCommunities.map((community) => (
          <CommunityPreviewItem
            key={community.id}
            id={community.id}
            name={community.name}
            photo={community.photo}
          />
        ))}
      </div>
    </div>
  );
}
