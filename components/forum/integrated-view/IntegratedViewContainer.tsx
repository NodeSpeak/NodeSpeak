"use client";

import React, { useEffect, useMemo, useCallback } from "react";
import { Contract } from "ethers";
import { Button } from "@/components/ui/button";
import DOMPurify from "dompurify";
import { toast } from "sonner";
import { useWalletContext } from "@/contexts/WalletContext";
import { useAdminContext } from "@/contexts/AdminContext";
import { useCommunitySettings } from "@/contexts/CommunitySettingsContext";
import { MembershipRequestsPanel } from "@/components/MembershipRequestsPanel";
import { formatAddress } from "@/lib/addressUtils";
import { useProfileService } from "@/lib/profileService";
import { uploadFile } from "@/lib/ipfsClient";
import {
  useAddComment,
  useDeactivateComment,
  useLikePost,
  useDeactivatePost,
  useAddTopic,
  useDeactivateCommunity,
  useUserPostLikes,
} from "@/hooks/queries";

import { CreatePostPanel } from "./CreatePostPanel";
import { CommunityExplorerPanel } from "./CommunityExplorerPanel";
import { CommunityBanner } from "./CommunityBanner";
import { CommunityHeader } from "./CommunityHeader";
import { ClosedCommunityNotice } from "./ClosedCommunityNotice";
import { PostFeed } from "./PostFeed";
import { useIntegratedViewState } from "./hooks/useIntegratedViewState";
import type { Community, Post, Comment, IntegratedViewProps } from "./types";

/**
 * IntegratedViewContainer - Main orchestrator component
 */
export const IntegratedViewContainer: React.FC<IntegratedViewProps> = ({
  communities,
  posts,
  fetchPostsFromContract,
  forumAddress,
  forumABI,
  provider,
  isCreatingCommunity,
  setIsCreatingCommunity,
  handleCreateCommunity,
  handleJoinCommunity,
  handleLeaveCommunity,
  isLoading,
  creatingCommunity,
  joiningCommunityId,
  leavingCommunityId,
  refreshCommunities,
  fetchPostsForCommunity,
  isCreatingPost: externalIsCreatingPost,
  setIsCreatingPost: externalSetIsCreatingPost,
  selectedCommunityId: externalSelectedCommunityId,
  setSelectedCommunityId: externalSetSelectedCommunityId,
  showCommunityList: externalShowCommunityList,
  setShowCommunityList: externalSetShowCommunityList,
}) => {
  const { isConnected, provider: walletProvider, address: currentUserAddress } = useWalletContext();
  const { isUserHidden, isCommunityHidden, hideCommunity } = useAdminContext();
  const { isCommunityOpen, requestMembership, hasPendingRequest } = useCommunitySettings();
  const profileService = useProfileService();
  const { state, actions } = useIntegratedViewState(communities);

  // React Query Mutations
  const likePostMutation = useLikePost();
  const deactivatePostMutation = useDeactivatePost();
  const addCommentMutation = useAddComment();
  const deactivateCommentMutation = useDeactivateComment();
  const addTopicMutation = useAddTopic();
  const deactivateCommunityMutation = useDeactivateCommunity();

  // Resolve external vs internal state
  const showCommunityList = externalShowCommunityList ?? state.showCommunityList;
  const setShowCommunityList = externalSetShowCommunityList || actions.setShowCommunityList;
  const isCreatingPost = externalIsCreatingPost ?? state.isCreatingPost;
  const setIsCreatingPost = externalSetIsCreatingPost || actions.setIsCreatingPost;
  const selectedCommunityId = externalSelectedCommunityId ?? state.selectedCommunityId;
  const setSelectedCommunityId = externalSetSelectedCommunityId || actions.setSelectedCommunity;

  // React Query for user likes
  const postIds = useMemo(() => posts.map((p) => p.id), [posts]);
  const { data: userLikedPostsData = {} } = useUserPostLikes(postIds);

  // Effects
  useEffect(() => { actions.setLocalCommunities(communities); }, [communities, actions]);
  useEffect(() => { if (externalSelectedCommunityId !== undefined) actions.setSelectedCommunity(externalSelectedCommunityId); }, [externalSelectedCommunityId, actions]);
  useEffect(() => { if (selectedCommunityId && fetchPostsForCommunity) fetchPostsForCommunity(selectedCommunityId); }, [selectedCommunityId, fetchPostsForCommunity]);
  useEffect(() => {
    if (selectedCommunityId) {
      const community = state.localCommunities.find((c) => c.id === selectedCommunityId) || communities.find((c) => c.id === selectedCommunityId);
      if (community) actions.setCommunityTopics(community.topics.map((name, id) => ({ id, name })));
    } else actions.setCommunityTopics([]);
  }, [selectedCommunityId, communities, state.localCommunities, actions]);
  useEffect(() => { if (isCreatingPost) { actions.setNewPost("<p>Write your post here...</p>"); actions.setSelectedImage(null); actions.setPostSelectedTopic(""); } }, [isCreatingPost, actions]);
  useEffect(() => { if (Object.keys(userLikedPostsData).length > 0) actions.setUserLikedPosts(userLikedPostsData); }, [userLikedPostsData, actions]);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-post-menu]")) actions.closeAllPostMenus();
      if (!target.closest("[data-comment-menu]")) actions.closeAllCommentMenus();
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [actions]);
  useEffect(() => { actions.resetMembersData(); }, [selectedCommunityId, actions]);

  // Handlers
  const handleCommunityClick = useCallback((community: Community) => { setSelectedCommunityId(community.id); setShowCommunityList(false); }, [setSelectedCommunityId, setShowCommunityList]);
  const handleTopicClick = useCallback((e: React.MouseEvent, topic: string) => { e.stopPropagation(); actions.setSelectedTopic(topic); }, [actions]);
  const getCommunityName = useCallback((id: string) => state.localCommunities.find((c) => c.id === id)?.name || `Community #${id}`, [state.localCommunities]);
  const formatDate = useCallback((ts: number) => new Date(ts * 1000).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }), []);

  const fetchCommentsForPost = useCallback(async (postId: string): Promise<Comment[]> => {
    if (!provider) return [];
    try {
      actions.setLoadingComments(postId, true);
      const contract = new Contract(forumAddress, forumABI, provider);
      const commentsData = await contract.getComments(postId);
      const result: Comment[] = commentsData
        .map((c: any, i: number) => ({
          id: `${postId}-${i}`,
          index: i + 1,
          postId,
          author: c.author,
          content: c.content,
          timestamp: Number(c.timestamp),
          isActive: c.isActive,
        }))
        .filter((c: Comment) => c.isActive);
      actions.setComments(postId, result);
      return result;
    } catch (error) {
      console.error(`Error fetching comments for post ${postId}:`, error);
      return [];
    } finally { actions.setLoadingComments(postId, false); }
  }, [provider, forumAddress, forumABI, actions]);

  const toggleComments = useCallback(async (postId: string) => { actions.toggleComments(postId); if (!state.expandedComments[postId] && !state.comments[postId]?.length) await fetchCommentsForPost(postId); }, [state.expandedComments, state.comments, actions, fetchCommentsForPost]);

  const addComment = useCallback(async (postId: string) => {
    if (!state.newCommentText[postId]?.trim() || !isConnected) { toast.error("Please enter a comment and connect your wallet"); return; }
    try {
      actions.setSubmittingComment(postId, true);
      await addCommentMutation.mutateAsync({ postId, content: state.newCommentText[postId] });
      actions.setNewCommentText(postId, "");
      await fetchCommentsForPost(postId);
    } catch { toast.error("Failed to add comment"); } finally { actions.setSubmittingComment(postId, false); }
  }, [state.newCommentText, isConnected, actions, addCommentMutation, fetchCommentsForPost]);

  const handleLikePost = useCallback(async (postId: string) => {
    if (!isConnected) { toast.error("Please connect your wallet to like posts"); return; }
    if (state.userLikedPosts[postId]) { toast.info("You have already liked this post"); return; }
    try {
      actions.setLikingPost(postId, true);
      await likePostMutation.mutateAsync(postId);
      actions.setUserLikedPosts({ ...state.userLikedPosts, [postId]: true });
    } catch { toast.error("Failed to like post"); } finally { actions.setLikingPost(postId, false); }
  }, [isConnected, state.userLikedPosts, actions, likePostMutation]);

  const handleDeletePost = useCallback(async (postId: string, author: string) => {
    if (!isConnected) { toast.error("Please connect your wallet"); return; }
    actions.closeAllPostMenus();
    if (!window.confirm("Delete this post?")) return;
    try {
      actions.setDeletingPost(postId, true);
      if (currentUserAddress && author.toLowerCase() !== currentUserAddress.toLowerCase()) { toast.error("Only the author can delete"); return; }
      await deactivatePostMutation.mutateAsync({ postId, communityId: selectedCommunityId || "" });
    } catch { toast.error("Failed to delete post"); } finally { actions.setDeletingPost(postId, false); }
  }, [isConnected, currentUserAddress, selectedCommunityId, deactivatePostMutation, actions]);

  const handleDeleteComment = useCallback(async (comment: Comment) => {
    if (!isConnected) { toast.error("Please connect your wallet"); return; }
    actions.closeAllCommentMenus();
    if (!window.confirm("Delete this comment?")) return;
    try {
      actions.setDeletingComment(comment.id, true);
      if (currentUserAddress && comment.author.toLowerCase() !== currentUserAddress.toLowerCase()) { toast.error("Only the author can delete"); return; }
      await deactivateCommentMutation.mutateAsync({ postId: comment.postId, commentIndex: comment.index });
      actions.setComments(comment.postId, state.comments[comment.postId]?.filter((c) => c.id !== comment.id) || []);
    } catch { toast.error("Failed to delete comment"); } finally { actions.setDeletingComment(comment.id, false); }
  }, [isConnected, currentUserAddress, state.comments, deactivateCommentMutation, actions]);

  const handleDeactivateCommunity = useCallback(async (communityId: string, name: string) => {
    if (!isConnected || !window.confirm(`Deactivate "${name}"?`)) return;
    try {
      actions.setDeactivatingCommunity(communityId);
      await deactivateCommunityMutation.mutateAsync(communityId);
      hideCommunity(communityId, name, `Deactivated by creator`);
      toast.success(`Community "${name}" deactivated`);
      if (selectedCommunityId === communityId) { setSelectedCommunityId(null); setShowCommunityList(true); }
    } catch { toast.error("Failed to deactivate"); } finally { actions.setDeactivatingCommunity(null); }
  }, [isConnected, selectedCommunityId, setSelectedCommunityId, setShowCommunityList, deactivateCommunityMutation, hideCommunity, actions]);

  const handleQuickAddTopic = useCallback(async (communityId: string) => {
    const name = window.prompt("Enter topic name:");
    if (!name?.trim()) return;
    try {
      actions.setIsSubmittingTopic(true);
      await addTopicMutation.mutateAsync({ communityId, topic: name.trim() });
      actions.setLocalCommunities(state.localCommunities.map((c) => c.id === communityId ? { ...c, topics: [...c.topics, name.trim()] } : c));
      if (selectedCommunityId === communityId) actions.setCommunityTopics([...state.communityTopics, { id: state.communityTopics.length, name: name.trim() }]);
      toast.success("Topic added!");
    } catch { toast.error("Failed to add topic"); } finally { actions.setIsSubmittingTopic(false); }
  }, [state.localCommunities, state.communityTopics, selectedCommunityId, addTopicMutation, actions]);

  const loadMembers = useCallback(async () => {
    if (!selectedCommunityId || state.loadingMembers) return;
    const community = state.localCommunities.find((c) => c.id === selectedCommunityId);
    if (!community) return;
    actions.setLoadingMembers(true);
    try {
      const memberSet = new Set<string>();
      if (community.creator) memberSet.add(community.creator.toLowerCase());
      posts.filter((p) => p.communityId === selectedCommunityId).forEach((p) => { if (p.author) memberSet.add(p.author.toLowerCase()); });
      const addresses = Array.from(memberSet);
      actions.setMembersList(addresses);
      const profiles = new Map<string, { nickname: string; profilePicture: string }>();
      for (const addr of addresses) {
        try {
          const p = await profileService.getProfile(addr);
          if (p) profiles.set(addr.toLowerCase(), { nickname: p.nickname || "", profilePicture: p.profilePicture || "" });
        } catch {}
      }
      actions.setMembersProfiles(profiles);
    } finally { actions.setLoadingMembers(false); }
  }, [selectedCommunityId, state.loadingMembers, state.localCommunities, posts, profileService, actions]);

  const handleMembersClick = useCallback(() => { if (!state.showMembersMenu) loadMembers(); actions.setShowMembersMenu(!state.showMembersMenu); }, [state.showMembersMenu, loadMembers, actions]);

  const handleSubmitPost = useCallback(async () => {
    if (!selectedCommunityId || !state.postSelectedTopic || !provider) { toast.error("Please fill all required fields"); return; }
    const tempEl = document.createElement("div");
    tempEl.innerHTML = DOMPurify.sanitize(state.newPost);
    if (!tempEl.textContent?.trim()) { toast.warning("Enter content for your post"); return; }
    try {
      actions.setLoading(true);
      let imageCID: string | null = null;
      if (state.selectedImage) imageCID = await uploadFile(state.selectedImage, state.selectedImage.name);
      const textBlob = new Blob([state.newPost], { type: "text/html" });
      const textCID = await uploadFile(new File([textBlob], "post.html"), "post.html");
      const signer = await provider.getSigner();
      const contract = new Contract(forumAddress, forumABI, signer);
      const tx = await contract.createPost(selectedCommunityId, "", textCID, imageCID ?? "", state.postSelectedTopic);
      await tx.wait();
      if (fetchPostsForCommunity) await fetchPostsForCommunity(selectedCommunityId);
      else await fetchPostsFromContract();
      actions.resetPostForm();
      setIsCreatingPost(false);
      toast.success("Post created!");
    } catch { toast.error("Failed to create post"); } finally { actions.setLoading(false); }
  }, [selectedCommunityId, state.postSelectedTopic, state.newPost, state.selectedImage, provider, forumAddress, forumABI, fetchPostsForCommunity, fetchPostsFromContract, setIsCreatingPost, actions]);

  const handleRequestAccess = useCallback((communityId: string) => {
    if (currentUserAddress && !hasPendingRequest(communityId, currentUserAddress)) {
      requestMembership(communityId, currentUserAddress);
      toast.success("Membership request sent!");
    }
  }, [currentUserAddress, hasPendingRequest, requestMembership]);

  // Computed values
  const availableTopics = useMemo(() => selectedCommunityId ? state.localCommunities.find((c) => c.id === selectedCommunityId)?.topics || [] : [], [selectedCommunityId, state.localCommunities]);
  const filteredPosts = useMemo(() => posts.filter((p) => p.isActive && !isUserHidden(p.author || "") && !isCommunityHidden(p.communityId) && (selectedCommunityId ? p.communityId === selectedCommunityId : true) && (state.selectedTopic ? p.topic === state.selectedTopic : true)).sort((a, b) => b.timestamp - a.timestamp), [posts, selectedCommunityId, state.selectedTopic, isUserHidden, isCommunityHidden]);
  const canViewCommunityContent = useMemo(() => { if (!selectedCommunityId) return true; const c = state.localCommunities.find((x) => x.id === selectedCommunityId); return isCommunityOpen(selectedCommunityId) || c?.isMember || c?.isCreator; }, [selectedCommunityId, state.localCommunities, isCommunityOpen]);
  const canCurrentUserAddTopics = useMemo(() => selectedCommunityId ? state.localCommunities.find((c) => c.id === selectedCommunityId)?.isCreator || false : false, [selectedCommunityId, state.localCommunities]);
  const selectedCommunity = useMemo(() => selectedCommunityId ? state.localCommunities.find((c) => c.id === selectedCommunityId) : null, [selectedCommunityId, state.localCommunities]);

  return (
    <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-slate-100 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{isCreatingCommunity ? "Create Community" : isCreatingPost ? "Create Post" : showCommunityList ? "Communities" : "Posts"}</h1>
          {!showCommunityList && state.selectedTopic && <p className="text-slate-500 text-sm mt-1">Filtered by: {state.selectedTopic}</p>}
        </div>
        <div className="flex items-center gap-3">
          {showCommunityList && <Button onClick={() => setIsCreatingCommunity(!isCreatingCommunity)} className={`rounded-full px-6 font-medium ${isCreatingCommunity ? "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200"}`}>{isCreatingCommunity ? "Cancel" : "Create Community"}</Button>}
          {!showCommunityList && !isCreatingCommunity && <Button onClick={() => { if (!selectedCommunityId) { toast.warning("Please select a community first"); return; } setIsCreatingPost(!isCreatingPost); }} className={`rounded-full px-6 font-medium ${isCreatingPost ? "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200"}`}>{isCreatingPost ? "Cancel" : "Create Post"}</Button>}
        </div>
      </div>

      {/* Content */}
      {isCreatingPost ? (
        <CreatePostPanel communities={state.localCommunities} selectedCommunityId={selectedCommunityId} communityTopics={state.communityTopics} postSelectedTopic={state.postSelectedTopic} newPost={state.newPost} selectedImage={state.selectedImage} loading={state.loading} canCurrentUserAddTopics={canCurrentUserAddTopics} onCommunityChange={(e) => { setSelectedCommunityId(e.target.value); actions.setPostSelectedTopic(""); }} onTopicChange={actions.setPostSelectedTopic} onContentChange={actions.setNewPost} onImageSelect={(e) => { const f = e.target.files?.[0]; if (f) actions.setSelectedImage(f); }} onSubmit={handleSubmitPost} onCancel={() => setIsCreatingPost(false)} onTopicsUpdate={actions.setCommunityTopics} />
      ) : showCommunityList ? (
        <CommunityExplorerPanel communities={state.localCommunities} selectedCommunityId={selectedCommunityId} joiningCommunityId={joiningCommunityId} leavingCommunityId={leavingCommunityId} currentUserAddress={currentUserAddress} isCommunityOpen={isCommunityOpen} hasPendingRequest={hasPendingRequest} onCommunityClick={handleCommunityClick} onJoinCommunity={handleJoinCommunity} onLeaveCommunity={handleLeaveCommunity} onRequestAccess={handleRequestAccess} onDeactivateCommunity={handleDeactivateCommunity} onTopicClick={handleTopicClick} />
      ) : (
        <div className="space-y-6">
          {selectedCommunity && <div className="mb-4"><CommunityBanner community={selectedCommunity} /></div>}
          <CommunityHeader selectedCommunityId={selectedCommunityId} selectedTopic={state.selectedTopic} availableTopics={availableTopics} localCommunities={state.localCommunities} isSubmittingTopic={state.isSubmittingTopic} showMembersMenu={state.showMembersMenu} membersList={state.membersList} membersProfiles={state.membersProfiles} loadingMembers={state.loadingMembers} onTopicSelect={actions.setSelectedTopic} onQuickAddTopic={handleQuickAddTopic} onMembersClick={handleMembersClick} onCloseMembersMenu={() => actions.setShowMembersMenu(false)} />
          {selectedCommunityId && !canViewCommunityContent && <ClosedCommunityNotice hasPendingRequest={currentUserAddress ? hasPendingRequest(selectedCommunityId, currentUserAddress) : false} currentUserAddress={currentUserAddress} onRequestAccess={() => handleRequestAccess(selectedCommunityId)} />}
          {selectedCommunity?.isCreator && !isCommunityOpen(selectedCommunityId!) && <MembershipRequestsPanel communityId={selectedCommunityId!} isCreator onApprove={async (addr) => { toast.success(`Approved ${formatAddress(addr)}`); }} currentUserAddress={currentUserAddress || undefined} />}
          {canViewCommunityContent && <PostFeed posts={filteredPosts} comments={state.comments} expandedComments={state.expandedComments} loadingComments={state.loadingComments} newCommentText={state.newCommentText} submittingComment={state.submittingComment} userLikedPosts={state.userLikedPosts} likingPost={state.likingPost} deletingPost={state.deletingPost} showPostMenu={state.showPostMenu} deletingComment={state.deletingComment} showCommentMenu={state.showCommentMenu} currentUserAddress={currentUserAddress} selectedCommunityId={selectedCommunityId} selectedTopic={state.selectedTopic} localCommunities={state.localCommunities} onToggleComments={toggleComments} onAddComment={addComment} onCommentTextChange={actions.setNewCommentText} onLikePost={handleLikePost} onDeletePost={handleDeletePost} onTogglePostMenu={actions.togglePostMenu} onDeleteComment={handleDeleteComment} onToggleCommentMenu={actions.toggleCommentMenu} getCommunityName={getCommunityName} formatDate={formatDate} isUserHidden={isUserHidden} />}
        </div>
      )}
    </div>
  );
};

export default IntegratedViewContainer;
