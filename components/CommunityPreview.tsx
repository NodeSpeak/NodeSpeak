"use client";

import React from 'react';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { usePublicCommunities } from '@/hooks/queries/useCommunities';
import { getImageUrl } from '@/lib/ipfsClient';
import { cn } from '@/lib/utils';
import Image from 'next/image';

/**
 * Skeleton para item de comunidad en preview (solo foto)
 */
function CommunityPreviewItemSkeleton() {
  return (
    <div className="w-[86%] mx-auto aspect-square rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 animate-pulse overflow-hidden">
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-600" />
      </div>
    </div>
  );
}

/**
 * Skeleton para sección completa de preview
 */
function CommunityPreviewSkeleton() {
  return (
    <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl shadow-lg shadow-slate-200/40 dark:shadow-slate-900/40 border border-white/60 dark:border-slate-700/60 p-3.5 overflow-hidden animate-fadeIn">
      {/* Decorative accent */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-violet-400 via-purple-500 to-pink-500" />

      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-900/50 dark:to-violet-800/50 flex items-center justify-center">
          <Users className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
        </div>
        <p className="text-[11px] font-bold tracking-wide text-slate-800 dark:text-slate-200 uppercase">
          Communities
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
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
      className="group relative w-[86%] mx-auto aspect-square rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 hover:ring-2 hover:ring-violet-400 dark:hover:ring-violet-500 hover:ring-offset-1 dark:hover:ring-offset-slate-800 transition-all duration-300 hover:scale-105"
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
          <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />
        </div>
      )}

      {/* Hover overlay with name */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-0 left-0 right-0 p-1.5">
          <p className="text-white text-[10px] font-semibold truncate drop-shadow-lg">
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
  const { data: communities, isLoading, isError } = usePublicCommunities();

  // Show skeleton while loading
  if (isLoading) {
    return <CommunityPreviewSkeleton />;
  }

  // Show error state or empty state gracefully
  if (isError || !communities || communities.length === 0) {
    return (
      <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl shadow-lg shadow-slate-200/40 dark:shadow-slate-900/40 border border-white/60 dark:border-slate-700/60 p-3.5 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-violet-400 via-purple-500 to-pink-500" />
        <div className="flex items-center gap-2 mb-2.5">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-900/50 dark:to-violet-800/50 flex items-center justify-center">
            <Users className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
          </div>
          <p className="text-[11px] font-bold tracking-wide text-slate-800 dark:text-slate-200 uppercase">
            Communities
          </p>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center py-3">
          {isError ? 'Unable to load communities' : 'No communities yet'}
        </p>
      </div>
    );
  }

  // Show first 3 communities
  const displayCommunities = communities.slice(0, 3);

  return (
    <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl shadow-lg shadow-slate-200/40 dark:shadow-slate-900/40 border border-white/60 dark:border-slate-700/60 p-3.5 overflow-hidden animate-fadeIn">
      {/* Decorative accent */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-violet-400 via-purple-500 to-pink-500" />

      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-900/50 dark:to-violet-800/50 flex items-center justify-center">
          <Users className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
        </div>
        <p className="text-[11px] font-bold tracking-wide text-slate-800 dark:text-slate-200 uppercase">
          Communities
        </p>
      </div>

      {/* Grid de fotos 3x2 */}
      <div className="grid grid-cols-3 gap-2">
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
