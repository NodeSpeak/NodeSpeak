"use client";

import { useReducer, useCallback, useMemo } from "react";
import type {
  Community,
  Comment,
  Topic,
  MemberProfile,
  IntegratedViewState,
  IntegratedViewAction,
} from "../types";

const initialState: IntegratedViewState = {
  selectedCommunityId: null,
  showCommunityList: true,
  selectedTopic: null,
  isCreatingPost: false,
  newPost: "<p>Write your post here...</p>",
  selectedImage: null,
  postSelectedTopic: "",
  communityTopics: [],
  loading: false,
  expandedComments: {},
  comments: {},
  newCommentText: {},
  loadingComments: {},
  submittingComment: {},
  likingPost: {},
  userLikedPosts: {},
  deletingPost: {},
  showPostMenu: {},
  deletingComment: {},
  showCommentMenu: {},
  localCommunities: [],
  newTopic: "",
  isSubmittingTopic: false,
  topicError: "",
  showAddTopicForm: {},
  deactivatingCommunityId: null,
  showMembersMenu: false,
  membersList: [],
  membersProfiles: new Map(),
  loadingMembers: false,
  showCommunityCoverEditor: false,
  tempCommunityCoverImage: "",
};

function reducer(
  state: IntegratedViewState,
  action: IntegratedViewAction
): IntegratedViewState {
  switch (action.type) {
    case "SET_SELECTED_COMMUNITY":
      return { ...state, selectedCommunityId: action.payload };
    case "SET_SHOW_COMMUNITY_LIST":
      return { ...state, showCommunityList: action.payload };
    case "SET_SELECTED_TOPIC":
      return { ...state, selectedTopic: action.payload };
    case "SET_IS_CREATING_POST":
      return { ...state, isCreatingPost: action.payload };
    case "SET_NEW_POST":
      return { ...state, newPost: action.payload };
    case "SET_SELECTED_IMAGE":
      return { ...state, selectedImage: action.payload };
    case "SET_POST_SELECTED_TOPIC":
      return { ...state, postSelectedTopic: action.payload };
    case "SET_COMMUNITY_TOPICS":
      return { ...state, communityTopics: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "TOGGLE_COMMENTS":
      return {
        ...state,
        expandedComments: {
          ...state.expandedComments,
          [action.payload]: !state.expandedComments[action.payload],
        },
      };
    case "SET_COMMENTS":
      return {
        ...state,
        comments: {
          ...state.comments,
          [action.payload.postId]: action.payload.comments,
        },
      };
    case "SET_NEW_COMMENT_TEXT":
      return {
        ...state,
        newCommentText: {
          ...state.newCommentText,
          [action.payload.postId]: action.payload.text,
        },
      };
    case "SET_LOADING_COMMENTS":
      return {
        ...state,
        loadingComments: {
          ...state.loadingComments,
          [action.payload.postId]: action.payload.loading,
        },
      };
    case "SET_SUBMITTING_COMMENT":
      return {
        ...state,
        submittingComment: {
          ...state.submittingComment,
          [action.payload.postId]: action.payload.submitting,
        },
      };
    case "SET_LIKING_POST":
      return {
        ...state,
        likingPost: {
          ...state.likingPost,
          [action.payload.postId]: action.payload.liking,
        },
      };
    case "SET_USER_LIKED_POSTS":
      return { ...state, userLikedPosts: action.payload };
    case "SET_DELETING_POST":
      return {
        ...state,
        deletingPost: {
          ...state.deletingPost,
          [action.payload.postId]: action.payload.deleting,
        },
      };
    case "TOGGLE_POST_MENU":
      return {
        ...state,
        showPostMenu: {
          ...Object.keys(state.showPostMenu).reduce(
            (acc, key) => ({ ...acc, [key]: false }),
            {}
          ),
          [action.payload]: !state.showPostMenu[action.payload],
        },
      };
    case "CLOSE_ALL_POST_MENUS":
      return { ...state, showPostMenu: {} };
    case "SET_DELETING_COMMENT":
      return {
        ...state,
        deletingComment: {
          ...state.deletingComment,
          [action.payload.commentId]: action.payload.deleting,
        },
      };
    case "TOGGLE_COMMENT_MENU":
      return {
        ...state,
        showCommentMenu: {
          ...Object.keys(state.showCommentMenu).reduce(
            (acc, key) => ({ ...acc, [key]: false }),
            {}
          ),
          [action.payload]: !state.showCommentMenu[action.payload],
        },
      };
    case "CLOSE_ALL_COMMENT_MENUS":
      return { ...state, showCommentMenu: {} };
    case "SET_LOCAL_COMMUNITIES":
      return { ...state, localCommunities: action.payload };
    case "SET_NEW_TOPIC":
      return { ...state, newTopic: action.payload };
    case "SET_IS_SUBMITTING_TOPIC":
      return { ...state, isSubmittingTopic: action.payload };
    case "SET_TOPIC_ERROR":
      return { ...state, topicError: action.payload };
    case "TOGGLE_ADD_TOPIC_FORM":
      return {
        ...state,
        showAddTopicForm: {
          ...state.showAddTopicForm,
          [action.payload]: !state.showAddTopicForm[action.payload],
        },
      };
    case "CLOSE_ADD_TOPIC_FORM":
      return {
        ...state,
        showAddTopicForm: {
          ...state.showAddTopicForm,
          [action.payload]: false,
        },
      };
    case "SET_DEACTIVATING_COMMUNITY":
      return { ...state, deactivatingCommunityId: action.payload };
    case "SET_SHOW_MEMBERS_MENU":
      return { ...state, showMembersMenu: action.payload };
    case "SET_MEMBERS_LIST":
      return { ...state, membersList: action.payload };
    case "SET_MEMBERS_PROFILES":
      return { ...state, membersProfiles: action.payload };
    case "SET_LOADING_MEMBERS":
      return { ...state, loadingMembers: action.payload };
    case "RESET_MEMBERS_DATA":
      return {
        ...state,
        membersList: [],
        membersProfiles: new Map(),
        showMembersMenu: false,
      };
    case "RESET_POST_FORM":
      return {
        ...state,
        newPost: "<p>Write your post here...</p>",
        selectedImage: null,
        postSelectedTopic: "",
        isCreatingPost: false,
      };
    default:
      return state;
  }
}

export interface UseIntegratedViewStateReturn {
  state: IntegratedViewState;
  actions: {
    setSelectedCommunity: (id: string | null) => void;
    setShowCommunityList: (show: boolean) => void;
    setSelectedTopic: (topic: string | null) => void;
    setIsCreatingPost: (creating: boolean) => void;
    setNewPost: (content: string) => void;
    setSelectedImage: (file: File | null) => void;
    setPostSelectedTopic: (topic: string) => void;
    setCommunityTopics: (topics: Topic[]) => void;
    setLoading: (loading: boolean) => void;
    toggleComments: (postId: string) => void;
    setComments: (postId: string, comments: Comment[]) => void;
    setNewCommentText: (postId: string, text: string) => void;
    setLoadingComments: (postId: string, loading: boolean) => void;
    setSubmittingComment: (postId: string, submitting: boolean) => void;
    setLikingPost: (postId: string, liking: boolean) => void;
    setUserLikedPosts: (likes: Record<string, boolean>) => void;
    setDeletingPost: (postId: string, deleting: boolean) => void;
    togglePostMenu: (postId: string) => void;
    closeAllPostMenus: () => void;
    setDeletingComment: (commentId: string, deleting: boolean) => void;
    toggleCommentMenu: (commentId: string) => void;
    closeAllCommentMenus: () => void;
    setLocalCommunities: (communities: Community[]) => void;
    setNewTopic: (topic: string) => void;
    setIsSubmittingTopic: (submitting: boolean) => void;
    setTopicError: (error: string) => void;
    toggleAddTopicForm: (communityId: string) => void;
    closeAddTopicForm: (communityId: string) => void;
    setDeactivatingCommunity: (id: string | null) => void;
    setShowMembersMenu: (show: boolean) => void;
    setMembersList: (members: string[]) => void;
    setMembersProfiles: (profiles: Map<string, MemberProfile>) => void;
    setLoadingMembers: (loading: boolean) => void;
    resetMembersData: () => void;
    resetPostForm: () => void;
  };
}

export function useIntegratedViewState(
  initialCommunities: Community[] = []
): UseIntegratedViewStateReturn {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    localCommunities: initialCommunities,
  });

  const actions = useMemo(
    () => ({
      setSelectedCommunity: (id: string | null) =>
        dispatch({ type: "SET_SELECTED_COMMUNITY", payload: id }),
      setShowCommunityList: (show: boolean) =>
        dispatch({ type: "SET_SHOW_COMMUNITY_LIST", payload: show }),
      setSelectedTopic: (topic: string | null) =>
        dispatch({ type: "SET_SELECTED_TOPIC", payload: topic }),
      setIsCreatingPost: (creating: boolean) =>
        dispatch({ type: "SET_IS_CREATING_POST", payload: creating }),
      setNewPost: (content: string) =>
        dispatch({ type: "SET_NEW_POST", payload: content }),
      setSelectedImage: (file: File | null) =>
        dispatch({ type: "SET_SELECTED_IMAGE", payload: file }),
      setPostSelectedTopic: (topic: string) =>
        dispatch({ type: "SET_POST_SELECTED_TOPIC", payload: topic }),
      setCommunityTopics: (topics: Topic[]) =>
        dispatch({ type: "SET_COMMUNITY_TOPICS", payload: topics }),
      setLoading: (loading: boolean) =>
        dispatch({ type: "SET_LOADING", payload: loading }),
      toggleComments: (postId: string) =>
        dispatch({ type: "TOGGLE_COMMENTS", payload: postId }),
      setComments: (postId: string, comments: Comment[]) =>
        dispatch({ type: "SET_COMMENTS", payload: { postId, comments } }),
      setNewCommentText: (postId: string, text: string) =>
        dispatch({ type: "SET_NEW_COMMENT_TEXT", payload: { postId, text } }),
      setLoadingComments: (postId: string, loading: boolean) =>
        dispatch({ type: "SET_LOADING_COMMENTS", payload: { postId, loading } }),
      setSubmittingComment: (postId: string, submitting: boolean) =>
        dispatch({ type: "SET_SUBMITTING_COMMENT", payload: { postId, submitting } }),
      setLikingPost: (postId: string, liking: boolean) =>
        dispatch({ type: "SET_LIKING_POST", payload: { postId, liking } }),
      setUserLikedPosts: (likes: Record<string, boolean>) =>
        dispatch({ type: "SET_USER_LIKED_POSTS", payload: likes }),
      setDeletingPost: (postId: string, deleting: boolean) =>
        dispatch({ type: "SET_DELETING_POST", payload: { postId, deleting } }),
      togglePostMenu: (postId: string) =>
        dispatch({ type: "TOGGLE_POST_MENU", payload: postId }),
      closeAllPostMenus: () => dispatch({ type: "CLOSE_ALL_POST_MENUS" }),
      setDeletingComment: (commentId: string, deleting: boolean) =>
        dispatch({ type: "SET_DELETING_COMMENT", payload: { commentId, deleting } }),
      toggleCommentMenu: (commentId: string) =>
        dispatch({ type: "TOGGLE_COMMENT_MENU", payload: commentId }),
      closeAllCommentMenus: () => dispatch({ type: "CLOSE_ALL_COMMENT_MENUS" }),
      setLocalCommunities: (communities: Community[]) =>
        dispatch({ type: "SET_LOCAL_COMMUNITIES", payload: communities }),
      setNewTopic: (topic: string) =>
        dispatch({ type: "SET_NEW_TOPIC", payload: topic }),
      setIsSubmittingTopic: (submitting: boolean) =>
        dispatch({ type: "SET_IS_SUBMITTING_TOPIC", payload: submitting }),
      setTopicError: (error: string) =>
        dispatch({ type: "SET_TOPIC_ERROR", payload: error }),
      toggleAddTopicForm: (communityId: string) =>
        dispatch({ type: "TOGGLE_ADD_TOPIC_FORM", payload: communityId }),
      closeAddTopicForm: (communityId: string) =>
        dispatch({ type: "CLOSE_ADD_TOPIC_FORM", payload: communityId }),
      setDeactivatingCommunity: (id: string | null) =>
        dispatch({ type: "SET_DEACTIVATING_COMMUNITY", payload: id }),
      setShowMembersMenu: (show: boolean) =>
        dispatch({ type: "SET_SHOW_MEMBERS_MENU", payload: show }),
      setMembersList: (members: string[]) =>
        dispatch({ type: "SET_MEMBERS_LIST", payload: members }),
      setMembersProfiles: (profiles: Map<string, MemberProfile>) =>
        dispatch({ type: "SET_MEMBERS_PROFILES", payload: profiles }),
      setLoadingMembers: (loading: boolean) =>
        dispatch({ type: "SET_LOADING_MEMBERS", payload: loading }),
      resetMembersData: () => dispatch({ type: "RESET_MEMBERS_DATA" }),
      resetPostForm: () => dispatch({ type: "RESET_POST_FORM" }),
    }),
    []
  );

  return { state, actions };
}
