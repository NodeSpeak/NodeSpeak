"use client";

import React from "react";
import { CommunityCard } from "./CommunityCard";
import type { Community } from "./types";

interface CommunityExplorerPanelProps {
  communities: Community[];
  selectedCommunityId: string | null;
  joiningCommunityId: string | null;
  leavingCommunityId: string | null;
  currentUserAddress: string | null;
  isCommunityOpen: (communityId: string) => boolean;
  hasPendingRequest: (communityId: string, address: string) => boolean;
  onCommunityClick: (community: Community) => void;
  onJoinCommunity: (communityId: string) => void;
  onLeaveCommunity: (communityId: string) => void;
  onRequestAccess: (communityId: string) => void;
  onDeactivateCommunity: (communityId: string, communityName: string) => void;
  onTopicClick: (e: React.MouseEvent, topic: string) => void;
}

/**
 * CommunityExplorerPanel - Displays list of communities
 */
export const CommunityExplorerPanel: React.FC<CommunityExplorerPanelProps> = ({
  communities,
  selectedCommunityId,
  joiningCommunityId,
  leavingCommunityId,
  currentUserAddress,
  isCommunityOpen,
  hasPendingRequest,
  onCommunityClick,
  onJoinCommunity,
  onLeaveCommunity,
  onRequestAccess,
  onDeactivateCommunity,
  onTopicClick,
}) => {
  const sortedCommunities = [...communities].sort((a, b) => {
    const idA = parseInt(a.id) || 0;
    const idB = parseInt(b.id) || 0;
    return idB - idA;
  });

  if (communities.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <p className="text-slate-700 dark:text-slate-300 mb-2 font-medium">No communities found.</p>
        <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Create the first one!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {sortedCommunities.map((community) => (
        <CommunityCard
          key={community.id}
          community={community}
          isSelected={selectedCommunityId === community.id}
          isCommunityOpen={isCommunityOpen(community.id)}
          hasPendingRequest={currentUserAddress ? hasPendingRequest(community.id, currentUserAddress) : false}
          joiningCommunityId={joiningCommunityId}
          leavingCommunityId={leavingCommunityId}
          currentUserAddress={currentUserAddress}
          onCommunityClick={() => onCommunityClick(community)}
          onJoinCommunity={() => onJoinCommunity(community.id)}
          onLeaveCommunity={() => onLeaveCommunity(community.id)}
          onRequestAccess={() => onRequestAccess(community.id)}
          onDeactivateCommunity={() => onDeactivateCommunity(community.id, community.name)}
          onTopicClick={onTopicClick}
        />
      ))}
    </div>
  );
};

export default CommunityExplorerPanel;
