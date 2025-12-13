"use client";

import React from "react";
import { Lock } from "lucide-react";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { toast } from 'sonner';

interface Community {
    id: string;
    name: string;
    description: string;
    topicCount: number;
    postCount: number;
    creator: string;
    isMember?: boolean;
    isCreator?: boolean;
    memberCount?: number;
    topics: string[];
    photo?: string;
    coverImage?: string;
}

interface CommunityCardProps {
    community: Community;
    isSelected: boolean;
    onCommunityClick: (community: Community) => void;
    onJoinCommunity: (communityId: string) => void;
    onLeaveCommunity: (communityId: string) => void;
    onDeactivateCommunity: (communityId: string, communityName: string) => void;
    onTopicClick: (e: React.MouseEvent, topic: string) => void;
    joiningCommunityId: string | null;
    leavingCommunityId: string | null;
    isCommunityOpen: (communityId: string) => boolean;
    hasPendingRequest: (communityId: string, userAddress: string) => boolean;
    requestMembership: (communityId: string, userAddress: string) => void;
    currentUserAddress: string | null;
    showAddTopicForm: boolean;
    onToggleAddTopicForm: () => void;
    onAddTopic: (communityId: string, e: React.FormEvent) => void;
    newTopic: string;
    setNewTopic: (value: string) => void;
    isSubmittingTopic: boolean;
    topicError: string;
    topicInputRef: React.RefObject<HTMLInputElement>;
}

export const CommunityCard: React.FC<CommunityCardProps> = ({
    community,
    isSelected,
    onCommunityClick,
    onJoinCommunity,
    onLeaveCommunity,
    onDeactivateCommunity,
    onTopicClick,
    joiningCommunityId,
    leavingCommunityId,
    isCommunityOpen,
    hasPendingRequest,
    requestMembership,
    currentUserAddress,
    showAddTopicForm,
    onToggleAddTopicForm,
    onAddTopic,
    newTopic,
    setNewTopic,
    isSubmittingTopic,
    topicError,
    topicInputRef,
}) => {
    const handleMembershipAction = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (community.isMember) {
            onLeaveCommunity(community.id);
        } else if (!isCommunityOpen(community.id)) {
            if (currentUserAddress && !hasPendingRequest(community.id, currentUserAddress)) {
                requestMembership(community.id, currentUserAddress);
                toast.success('Membership request sent! The community creator will review it.');
            }
        } else {
            onJoinCommunity(community.id);
        }
    };

    const getMembershipButtonText = () => {
        if (joiningCommunityId === community.id) return "Joining...";
        if (leavingCommunityId === community.id) return "Leaving...";
        if (community.isMember) return "Leave";
        if (!isCommunityOpen(community.id)) {
            return hasPendingRequest(community.id, currentUserAddress || '') ? "Pending..." : "Request Access";
        }
        return "Join";
    };

    const getMembershipButtonClass = () => {
        if (joiningCommunityId === community.id || leavingCommunityId === community.id) {
            return "bg-slate-200 text-slate-500";
        }
        if (community.isMember) {
            return "bg-white/90 hover:bg-white text-slate-600";
        }
        if (!isCommunityOpen(community.id)) {
            return hasPendingRequest(community.id, currentUserAddress || '')
                ? "bg-amber-100 text-amber-700"
                : "bg-amber-500 hover:bg-amber-600 text-white";
        }
        return "bg-indigo-600 hover:bg-indigo-700 text-white";
    };

    return (
        <div
            className={`relative rounded-3xl overflow-hidden cursor-pointer transition-all hover:shadow-xl bg-white dark:bg-slate-800 border ${
                isSelected
                    ? "ring-2 ring-indigo-400 dark:ring-indigo-500 border-indigo-200 dark:border-indigo-700"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
            }`}
            onClick={() => onCommunityClick(community)}
        >
            {/* Banner section */}
            <div className="relative h-40">
                {community.coverImage ? (
                    <>
                        <ImageWithFallback
                            cid={community.coverImage}
                            alt={`${community.name} cover`}
                            className="w-full h-full object-cover"
                            fallback={<div className="w-full h-full bg-gradient-to-br from-indigo-100 via-slate-100 to-slate-50" />}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                    </>
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-100 via-slate-100 to-slate-50"></div>
                )}

                {/* Closed community badge */}
                {!isCommunityOpen(community.id) && (
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
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeactivateCommunity(community.id, community.name);
                            }}
                            className="text-xs py-1.5 px-3 rounded-full transition-colors bg-red-50 hover:bg-red-100 text-red-600 font-medium shadow-sm border border-red-200"
                        >
                            Desactivar Comunidad
                        </button>
                    )}
                    {!community.isCreator && (
                        <button
                            onClick={handleMembershipAction}
                            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all shadow-sm ${getMembershipButtonClass()}`}
                            disabled={
                                joiningCommunityId === community.id ||
                                leavingCommunityId === community.id ||
                                (!!currentUserAddress && hasPendingRequest(community.id, currentUserAddress))
                            }
                        >
                            {getMembershipButtonText()}
                        </button>
                    )}
                </div>

                {/* Avatar + Name + Description */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="flex items-end gap-4">
                        <div className="flex-shrink-0 w-16 h-16 rounded-2xl border-3 border-white bg-white shadow-lg overflow-hidden">
                            {community.photo ? (
                                <ImageWithFallback
                                    cid={community.photo}
                                    alt={community.name}
                                    className="w-full h-full object-cover"
                                    fallback={
                                        <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600 font-semibold text-xl">
                                            {community.name.charAt(0).toUpperCase()}
                                        </div>
                                    }
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600 font-semibold text-xl">
                                    {community.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className={`text-2xl font-semibold tracking-tight truncate ${community.coverImage ? 'text-white drop-shadow-md' : 'text-slate-900'}`}>
                                {community.name}
                            </h3>
                            <p className={`text-sm mt-0.5 line-clamp-1 ${community.coverImage ? 'text-white/80' : 'text-slate-500'}`}>
                                {community.description}
                            </p>
                        </div>

                        <div className={`flex-shrink-0 text-right ${community.coverImage ? 'text-white/90' : 'text-slate-500'}`}>
                            <div className="text-sm font-medium">{community.memberCount || 0} members</div>
                            <div className="text-xs opacity-80">{community.postCount} posts</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content below banner */}
            <div className="px-6 py-5">
                {/* Add Topic Form */}
                <div
                    className={`rounded-xl overflow-hidden transition-all duration-300 ${
                        showAddTopicForm
                            ? 'max-h-20 opacity-100 p-4 bg-slate-50 mb-4'
                            : 'max-h-0 opacity-0 p-0 mb-0'
                    }`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {showAddTopicForm && (
                        <form onSubmit={(e) => onAddTopic(community.id, e)} className="flex gap-3">
                            <input
                                type="text"
                                ref={topicInputRef}
                                value={newTopic}
                                onChange={(e) => setNewTopic(e.target.value)}
                                placeholder="New topic name"
                                className="flex-grow bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                                onClick={(e) => e.stopPropagation()}
                            />
                            <button
                                type="submit"
                                className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-indigo-700 transition-colors"
                                disabled={isSubmittingTopic}
                            >
                                {isSubmittingTopic ? "..." : "Add"}
                            </button>
                        </form>
                    )}
                </div>

                {/* Topics + Badge row */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-1.5 flex-1">
                        {community.topics.slice(0, 4).map((topic, index) => (
                            <button
                                key={index}
                                onClick={(e) => onTopicClick(e, topic)}
                                className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                            >
                                {topic}
                            </button>
                        ))}
                        {community.topics.length > 4 && (
                            <span className="px-2.5 py-1 text-xs text-slate-400">
                                +{community.topics.length - 4} more
                            </span>
                        )}
                    </div>

                    {community.isCreator && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600 border border-indigo-100">
                            Creator
                        </span>
                    )}
                    {community.isMember && !community.isCreator && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                            Member
                        </span>
                    )}
                </div>

                {topicError && showAddTopicForm && (
                    <div className="text-red-500 text-xs mt-2">{topicError}</div>
                )}
            </div>
        </div>
    );
};
