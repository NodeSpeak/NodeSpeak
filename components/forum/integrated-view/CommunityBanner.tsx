"use client";

import React from "react";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import type { Community } from "./types";

interface CommunityBannerProps {
  community: Community;
}

/**
 * CommunityBanner - Displays selected community's cover and info
 */
export const CommunityBanner: React.FC<CommunityBannerProps> = ({ community }) => {
  if (community.coverImage) {
    return (
      <div className="relative mb-12">
        <div className="w-full h-44 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
          <ImageWithFallback cid={community.coverImage} alt={`${community.name} cover`} className="w-full h-full object-cover" fallback={<div className="w-full h-full bg-slate-200 dark:bg-slate-700" />} />
        </div>
        <div className="absolute -bottom-10 left-6 flex items-end gap-4">
          {community.photo && (
            <div className="w-28 h-28 rounded-2xl border-4 border-white dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-800 shadow-xl">
              <ImageWithFallback cid={community.photo} alt={community.name} className="w-full h-full object-cover" fallback={<div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center"><span className="text-slate-400 text-3xl font-semibold">{community.name.charAt(0).toUpperCase()}</span></div>} />
            </div>
          )}
          <div className="mb-2">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{community.name}</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm mb-4 flex items-center shadow-sm">
      {community.photo ? (
        <div className="w-16 h-16 rounded-full border-2 border-slate-200 dark:border-slate-700 overflow-hidden mr-4">
          <ImageWithFallback cid={community.photo} alt={community.name} className="w-full h-full object-cover" fallback={<div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-600 font-semibold">{community.name.charAt(0).toUpperCase()}</div>} />
        </div>
      ) : (
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-600 font-semibold border-2 border-slate-200 mr-4">{community.name.charAt(0).toUpperCase()}</div>
      )}
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{community.name}</h2>
    </div>
  );
};

export default CommunityBanner;
