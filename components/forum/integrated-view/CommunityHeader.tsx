"use client";

import React, { useRef, useEffect } from "react";
import { Users, ChevronDown, X, User } from "lucide-react";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { AddressText } from "@/components/AddressDisplay";
import type { Community, MemberProfile } from "./types";

interface CommunityHeaderProps {
  selectedCommunityId: string | null;
  selectedTopic: string | null;
  availableTopics: string[];
  localCommunities: Community[];
  isSubmittingTopic: boolean;
  showMembersMenu: boolean;
  membersList: string[];
  membersProfiles: Map<string, MemberProfile>;
  loadingMembers: boolean;
  onTopicSelect: (topic: string | null) => void;
  onQuickAddTopic: (communityId: string) => void;
  onMembersClick: () => void;
  onCloseMembersMenu: () => void;
}

/**
 * CommunityHeader - Topic filter bar with members menu
 */
export const CommunityHeader: React.FC<CommunityHeaderProps> = ({
  selectedCommunityId,
  selectedTopic,
  availableTopics,
  localCommunities,
  isSubmittingTopic,
  showMembersMenu,
  membersList,
  membersProfiles,
  loadingMembers,
  onTopicSelect,
  onQuickAddTopic,
  onMembersClick,
  onCloseMembersMenu,
}) => {
  const membersMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (membersMenuRef.current && !membersMenuRef.current.contains(e.target as Node)) {
        onCloseMembersMenu();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onCloseMembersMenu]);

  const selectedCommunity = selectedCommunityId ? localCommunities.find((c) => c.id === selectedCommunityId) : null;

  return (
    <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-500 dark:text-slate-400 text-sm mr-2">Filter:</span>
          <button onClick={() => onTopicSelect(null)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedTopic === null ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200"}`}>All</button>
          {availableTopics.map((topic) => (
            <button key={topic} onClick={() => onTopicSelect(topic)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedTopic === topic ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200"}`}>{topic}</button>
          ))}
          {selectedCommunityId && selectedCommunity?.isCreator && (
            <button onClick={() => onQuickAddTopic(selectedCommunityId)} disabled={isSubmittingTopic} className="ml-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50">{isSubmittingTopic ? "Adding..." : "+ New Topic"}</button>
          )}
        </div>

        {selectedCommunityId && (
          <div className="relative" ref={membersMenuRef}>
            <button onClick={onMembersClick} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-600 bg-white/80 dark:bg-slate-800/80 text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-sky-300 transition-colors">
              <Users className="w-3.5 h-3.5" />
              <span>Members</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showMembersMenu ? "rotate-180" : ""}`} />
            </button>

            {showMembersMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-white dark:from-slate-700 dark:to-slate-800 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Members ({membersList.length || selectedCommunity?.memberCount || 0})</p>
                  <button onClick={onCloseMembersMenu} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                  {loadingMembers ? (
                    <div className="flex items-center justify-center py-8"><div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>
                  ) : membersList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-500"><User className="w-8 h-8 mb-2 opacity-50" /><p className="text-sm">No members found yet</p></div>
                  ) : (
                    membersList.map((addr) => {
                      const profile = membersProfiles.get(addr.toLowerCase());
                      return (
                        <button key={addr} onClick={() => { window.location.href = `/profile?address=${addr}`; onCloseMembersMenu(); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-b-0 text-left">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-600 flex-shrink-0 border border-slate-300">
                            {profile?.profilePicture ? <ImageWithFallback cid={profile.profilePicture} alt="" className="w-full h-full object-cover" fallback={<div className="w-full h-full flex items-center justify-center"><User className="w-5 h-5 text-slate-400" /></div>} /> : <div className="w-full h-full flex items-center justify-center"><User className="w-5 h-5 text-slate-400" /></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{profile?.nickname || <AddressText value={addr} className="font-medium" />}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400"><AddressText value={addr} className="text-xs" /></p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityHeader;
