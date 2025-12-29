/**
 * Type definitions for IntegratedView components
 *
 * Centralized types ensure consistency across the modular architecture.
 */

// =============================================================================
// CORE ENTITY TYPES
// =============================================================================

export interface Community {
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
  isActive?: boolean;
}

export interface Post {
  id: string;
  content: string;
  timestamp: number;
  topic: string;
  imageUrl?: string;
  communityId: string;
  title: string;
  likeCount: number;
  commentCount: number;
  isActive: boolean;
  author?: string;
}

export interface Comment {
  id: string;
  index: number;
  postId: string;
  author: string;
  content: string;
  timestamp: number;
  isActive: boolean;
  likeCount?: number;
}

export interface Topic {
  id: number;
  name: string;
}

export interface MemberProfile {
  nickname: string;
  profilePicture: string;
}

// =============================================================================
// COMPONENT PROPS TYPES
// =============================================================================

export interface IntegratedViewProps {
  communities: Community[];
  posts: Post[];
  fetchPostsFromContract: () => Promise<void>;
  forumAddress: string;
  forumABI: any;
  provider: any;
  isCreatingCommunity: boolean;
  setIsCreatingCommunity: (value: boolean) => void;
  handleCreateCommunity: (
    name: string,
    description: string,
    topics: string[],
    photo?: File,
    cover?: File,
    isClosed?: boolean
  ) => Promise<void>;
  handleJoinCommunity: (communityId: string) => Promise<void>;
  handleLeaveCommunity: (communityId: string) => Promise<void>;
  isLoading: boolean;
  creatingCommunity: boolean;
  joiningCommunityId: string | null;
  leavingCommunityId: string | null;
  refreshCommunities?: () => Promise<void>;
  fetchPostsForCommunity?: (communityId: string) => Promise<void>;
  isCreatingPost?: boolean;
  setIsCreatingPost?: (value: boolean) => void;
  setIsCreating?: (value: boolean) => void;
  selectedCommunityId?: string | null;
  setSelectedCommunityId?: (communityId: string | null) => void;
  showCommunityList?: boolean;
  setShowCommunityList?: (value: boolean) => void;
}

export interface CreatePostPanelProps {
  communities: Community[];
  selectedCommunityId: string | null;
  communityTopics: Topic[];
  postSelectedTopic: string;
  newPost: string;
  selectedImage: File | null;
  loading: boolean;
  canCurrentUserAddTopics: boolean;
  onCommunityChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onTopicChange: (topic: string) => void;
  onContentChange: (content: string) => void;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => Promise<void>;
  onCancel: () => void;
  onTopicsUpdate: (topics: Topic[]) => void;
}

export interface PostFeedProps {
  posts: Post[];
  comments: Record<string, Comment[]>;
  expandedComments: Record<string, boolean>;
  loadingComments: Record<string, boolean>;
  newCommentText: Record<string, string>;
  submittingComment: Record<string, boolean>;
  userLikedPosts: Record<string, boolean>;
  likingPost: Record<string, boolean>;
  deletingPost: Record<string, boolean>;
  showPostMenu: Record<string, boolean>;
  deletingComment: Record<string, boolean>;
  showCommentMenu: Record<string, boolean>;
  currentUserAddress: string | null;
  selectedCommunityId: string | null;
  selectedTopic: string | null;
  localCommunities: Community[];
  onToggleComments: (postId: string) => void;
  onAddComment: (postId: string) => Promise<void>;
  onCommentTextChange: (postId: string, text: string) => void;
  onLikePost: (postId: string) => Promise<void>;
  onDeletePost: (postId: string, author: string) => Promise<void>;
  onTogglePostMenu: (postId: string) => void;
  onDeleteComment: (comment: Comment) => Promise<void>;
  onToggleCommentMenu: (commentId: string) => void;
  getCommunityName: (communityId: string) => string;
  formatDate: (timestamp: number) => string;
  isUserHidden: (address: string) => boolean;
}

export interface CommentsSectionProps {
  postId: string;
  comments: Comment[];
  loading: boolean;
  newCommentText: string;
  submitting: boolean;
  deletingComment: Record<string, boolean>;
  showCommentMenu: Record<string, boolean>;
  currentUserAddress: string | null;
  onAddComment: () => Promise<void>;
  onCommentTextChange: (text: string) => void;
  onDeleteComment: (comment: Comment) => Promise<void>;
  onToggleCommentMenu: (commentId: string) => void;
  formatDate: (timestamp: number) => string;
  isUserHidden: (address: string) => boolean;
}

export interface MatrixEditorProps {
  content: string;
  setContent: (content: string) => void;
}

export interface FormattedContentProps {
  htmlContent: string;
}

// =============================================================================
// STATE TYPES
// =============================================================================

export interface IntegratedViewState {
  selectedCommunityId: string | null;
  showCommunityList: boolean;
  selectedTopic: string | null;
  isCreatingPost: boolean;
  newPost: string;
  selectedImage: File | null;
  postSelectedTopic: string;
  communityTopics: Topic[];
  loading: boolean;
  expandedComments: Record<string, boolean>;
  comments: Record<string, Comment[]>;
  newCommentText: Record<string, string>;
  loadingComments: Record<string, boolean>;
  submittingComment: Record<string, boolean>;
  likingPost: Record<string, boolean>;
  userLikedPosts: Record<string, boolean>;
  deletingPost: Record<string, boolean>;
  showPostMenu: Record<string, boolean>;
  deletingComment: Record<string, boolean>;
  showCommentMenu: Record<string, boolean>;
  localCommunities: Community[];
  newTopic: string;
  isSubmittingTopic: boolean;
  topicError: string;
  showAddTopicForm: Record<string, boolean>;
  deactivatingCommunityId: string | null;
  showMembersMenu: boolean;
  membersList: string[];
  membersProfiles: Map<string, MemberProfile>;
  loadingMembers: boolean;
  showCommunityCoverEditor: boolean;
  tempCommunityCoverImage: string;
}

export type IntegratedViewAction =
  | { type: 'SET_SELECTED_COMMUNITY'; payload: string | null }
  | { type: 'SET_SHOW_COMMUNITY_LIST'; payload: boolean }
  | { type: 'SET_SELECTED_TOPIC'; payload: string | null }
  | { type: 'SET_IS_CREATING_POST'; payload: boolean }
  | { type: 'SET_NEW_POST'; payload: string }
  | { type: 'SET_SELECTED_IMAGE'; payload: File | null }
  | { type: 'SET_POST_SELECTED_TOPIC'; payload: string }
  | { type: 'SET_COMMUNITY_TOPICS'; payload: Topic[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'TOGGLE_COMMENTS'; payload: string }
  | { type: 'SET_COMMENTS'; payload: { postId: string; comments: Comment[] } }
  | { type: 'SET_NEW_COMMENT_TEXT'; payload: { postId: string; text: string } }
  | { type: 'SET_LOADING_COMMENTS'; payload: { postId: string; loading: boolean } }
  | { type: 'SET_SUBMITTING_COMMENT'; payload: { postId: string; submitting: boolean } }
  | { type: 'SET_LIKING_POST'; payload: { postId: string; liking: boolean } }
  | { type: 'SET_USER_LIKED_POSTS'; payload: Record<string, boolean> }
  | { type: 'SET_DELETING_POST'; payload: { postId: string; deleting: boolean } }
  | { type: 'TOGGLE_POST_MENU'; payload: string }
  | { type: 'CLOSE_ALL_POST_MENUS' }
  | { type: 'SET_DELETING_COMMENT'; payload: { commentId: string; deleting: boolean } }
  | { type: 'TOGGLE_COMMENT_MENU'; payload: string }
  | { type: 'CLOSE_ALL_COMMENT_MENUS' }
  | { type: 'SET_LOCAL_COMMUNITIES'; payload: Community[] }
  | { type: 'SET_NEW_TOPIC'; payload: string }
  | { type: 'SET_IS_SUBMITTING_TOPIC'; payload: boolean }
  | { type: 'SET_TOPIC_ERROR'; payload: string }
  | { type: 'TOGGLE_ADD_TOPIC_FORM'; payload: string }
  | { type: 'CLOSE_ADD_TOPIC_FORM'; payload: string }
  | { type: 'SET_DEACTIVATING_COMMUNITY'; payload: string | null }
  | { type: 'SET_SHOW_MEMBERS_MENU'; payload: boolean }
  | { type: 'SET_MEMBERS_LIST'; payload: string[] }
  | { type: 'SET_MEMBERS_PROFILES'; payload: Map<string, MemberProfile> }
  | { type: 'SET_LOADING_MEMBERS'; payload: boolean }
  | { type: 'RESET_MEMBERS_DATA' }
  | { type: 'RESET_POST_FORM' };
