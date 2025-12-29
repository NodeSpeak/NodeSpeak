"use client";

import React from "react";
import { Lock } from "lucide-react";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import type { Community } from "./types";

interface CommunityCardProps {
  community: Community;
  isSelected: boolean;
  isCommunityOpen: boolean;
  hasPendingRequest: boolean;
  joiningCommunityId: string | null;
  leavingCommunityId: string | null;
  currentUserAddress: string | null;
  onCommunityClick: () => void;
  onJoinCommunity: () => void;
  onLeaveCommunity: () => void;
  onRequestAccess: () => void;
  onDeactivateCommunity: () => void;
  onTopicClick: (e: React.MouseEvent, topic: string) => void;
}

/**
 * CommunityCard - Displays a single community with actions
 */
export const CommunityCard: React.FC<CommunityCardProps> = ({
  community,
  isSelected,
  isCommunityOpen,
  hasPendingRequest,
  joiningCommunityId,
  leavingCommunityId,
  currentUserAddress,
  onCommunityClick,
  onJoinCommunity,
  onLeaveCommunity,
  onRequestAccess,
  onDeactivateCommunity,
  onTopicClick,
}) => {
  const isJoining = joiningCommunityId === community.id;
  const isLeaving = leavingCommunityId === community.id;
  const isProcessing = isJoining || isLeaving;

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (community.isMember) {
      onLeaveCommunity();
    } else if (!isCommunityOpen) {
      if (currentUserAddress && !hasPendingRequest) onRequestAccess();
    } else {
      onJoinCommunity();
    }
  };

  const getActionButtonText = () => {
    if (isJoining) return "Joining...";
    if (isLeaving) return "Leaving...";
    if (community.isMember) return "Leave";
    if (!isCommunityOpen) return hasPendingRequest ? "Pending..." : "Request Access";
    return "Join";
  };

  const getActionButtonClass = () => {
    if (isProcessing) return "bg-slate-200 text-slate-500";
    if (community.isMember) return "bg-white/90 hover:bg-white text-slate-600";
    if (!isCommunityOpen) return hasPendingRequest ? "bg-amber-100 text-amber-700" : "bg-amber-500 hover:bg-amber-600 text-white";
    return "bg-indigo-600 hover:bg-indigo-700 text-white";
  };

  return (
    <div
      className={`relative rounded-3xl overflow-hidden cursor-pointer transition-all hover:shadow-xl bg-white dark:bg-slate-800 border ${
        isSelected
          ? "ring-2 ring-indigo-400 dark:ring-indigo-500 border-indigo-200 dark:border-indigo-700"
          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
      }`}
      onClick={onCommunityClick}
    >
      {/* Banner */}
      <div className="relative h-40">
        {community.coverImage ? (
          <>
            <ImageWithFallback cid={community.coverImage} alt={`${community.name} cover`} className="w-full h-full object-cover" fallback={<div className="w-full h-full bg-gradient-to-br from-indigo-100 via-slate-100 to-slate-50" />} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-100 via-slate-100 to-slate-50" />
        )}

        {/* Closed badge */}
        {!isCommunityOpen && (
          <div className="absolute top-4 left-4">
            <span className="bg-amber-100/90 backdrop-blur-sm text-amber-700 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm border border-amber-200/50">
              <Lock className="w-3 h-3" />
              Closed
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {community.isCreator && (
            <button onClick={(e) => { e.stopPropagation(); onDeactivateCommunity(); }} className="text-xs py-1.5 px-3 rounded-full transition-colors bg-red-50 hover:bg-red-100 text-red-600 font-medium shadow-sm border border-red-200">
              Deactivate
            </button>
          )}
          {!community.isCreator && (
            <button onClick={handleActionClick} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all shadow-sm ${getActionButtonClass()}`} disabled={isProcessing || (!!currentUserAddress && hasPendingRequest)}>
              {getActionButtonText()}
            </button>
          )}
        </div>

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-end gap-4">
            <div className="flex-shrink-0 w-16 h-16 rounded-2xl border-3 border-white bg-white shadow-lg overflow-hidden">
              {community.photo ? (
                <ImageWithFallback cid={community.photo} alt={community.name} className="w-full h-full object-cover" fallback={<div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600 font-semibold text-xl">{community.name.charAt(0).toUpperCase()}</div>} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600 font-semibold text-xl">{community.name.charAt(0).toUpperCase()}</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-2xl font-semibold tracking-tight truncate ${community.coverImage ? "text-white drop-shadow-md" : "text-slate-900"}`}>{community.name}</h3>
              <p className={`text-sm mt-0.5 line-clamp-1 ${community.coverImage ? "text-white/80" : "text-slate-500"}`}>{community.description}</p>
            </div>
            <div className={`flex-shrink-0 text-right ${community.coverImage ? "text-white/90" : "text-slate-500"}`}>
              <div className="text-sm font-medium">{community.memberCount || 0} members</div>
              <div className="text-xs opacity-80">{community.postCount} posts</div>
            </div>
          </div>
        </div>
      </div>

      {/* Topics */}
      <div className="px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-wrap gap-1.5 flex-1">
            {community.topics.slice(0, 4).map((topic, i) => (
              <button key={i} onClick={(e) => onTopicClick(e, topic)} className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors">{topic}</button>
            ))}
            {community.topics.length > 4 && <span className="px-2.5 py-1 text-xs text-slate-400">+{community.topics.length - 4} more</span>}
          </div>
          {community.isCreator && <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600 border border-indigo-100">Creator</span>}
          {community.isMember && !community.isCreator && <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">Member</span>}
        </div>
      </div>
    </div>
  );
};

export default CommunityCard;
