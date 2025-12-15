"use client";

import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { CommunityCard } from './CommunityCard';

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

interface VirtualizedCommunityListProps {
    communities: Community[];
    selectedCommunityId: string | null;
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
    showAddTopicForm: Record<string, boolean>;
    onToggleAddTopicForm: (communityId: string) => void;
    onAddTopic: (communityId: string, e: React.FormEvent) => void;
    newTopic: string;
    setNewTopic: (value: string) => void;
    isSubmittingTopic: boolean;
    topicError: string;
    topicInputRef: React.RefObject<HTMLInputElement>;
    containerHeight?: string;
    estimatedItemHeight?: number;
}

export const VirtualizedCommunityList: React.FC<VirtualizedCommunityListProps> = ({
    communities,
    selectedCommunityId,
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
    containerHeight = 'calc(100vh - 300px)',
    estimatedItemHeight = 280,
}) => {
    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: communities.length,
        getScrollElement: () => parentRef.current,
        estimateSize: (index) => {
            const community = communities[index];
            const hasAddTopicForm = showAddTopicForm[community.id];
            return hasAddTopicForm ? estimatedItemHeight + 80 : estimatedItemHeight;
        },
        overscan: 3,
        gap: 24,
    });

    const virtualItems = virtualizer.getVirtualItems();

    if (communities.length === 0) {
        return (
            <div className="text-center py-16 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <p className="text-slate-500 dark:text-slate-400 font-medium">No communities yet</p>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Create the first one!</p>
            </div>
        );
    }

    return (
        <div
            ref={parentRef}
            className="overflow-auto"
            style={{ 
                height: containerHeight,
                contain: 'strict',
            }}
        >
            <div
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {virtualItems.map((virtualItem) => {
                    const community = communities[virtualItem.index];
                    return (
                        <div
                            key={virtualItem.key}
                            data-index={virtualItem.index}
                            ref={virtualizer.measureElement}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                transform: `translateY(${virtualItem.start}px)`,
                            }}
                        >
                            <CommunityCard
                                community={community}
                                isSelected={selectedCommunityId === community.id}
                                onCommunityClick={onCommunityClick}
                                onJoinCommunity={onJoinCommunity}
                                onLeaveCommunity={onLeaveCommunity}
                                onDeactivateCommunity={onDeactivateCommunity}
                                onTopicClick={onTopicClick}
                                joiningCommunityId={joiningCommunityId}
                                leavingCommunityId={leavingCommunityId}
                                isCommunityOpen={isCommunityOpen}
                                hasPendingRequest={hasPendingRequest}
                                requestMembership={requestMembership}
                                currentUserAddress={currentUserAddress}
                                showAddTopicForm={showAddTopicForm[community.id] || false}
                                onToggleAddTopicForm={() => onToggleAddTopicForm(community.id)}
                                onAddTopic={onAddTopic}
                                newTopic={newTopic}
                                setNewTopic={setNewTopic}
                                isSubmittingTopic={isSubmittingTopic}
                                topicError={topicError}
                                topicInputRef={topicInputRef}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
