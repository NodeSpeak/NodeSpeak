// =============================================================================
// TYPES FOR FORUM DATA
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
  title: string;
  content: string;
  timestamp: number;
  author: string;
  imageUrl?: string;
  cid: string;
  topic: string;
  communityId: string;
  likeCount: number;
  commentCount: number;
  isActive: boolean;
}

export interface Comment {
  id: string;
  index: number; // 1-based index for contract calls
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

export interface Profile {
  address: string;
  nickname: string;
  profilePicture: string;
  coverPhoto: string;
  bio: string;
  likesGiven: number;
  likesReceived: number;
  postCount: number;
  commentCount: number;
  followerCount: number;
  followingCount: number;
  isActive: boolean;
  exists: boolean;
}

// Contract raw types (before parsing)
export interface RawCommunity {
  id: bigint;
  creator: string;
  contentCID: string;
  topics: string[];
  profileCID: string;
  coverCID: string;
  postCount: bigint;
  isActive: boolean;
}

export interface RawPost {
  id: bigint;
  author: string;
  title: string;
  contentCID: string;
  imageCID: string;
  topic: string;
  communityId: bigint;
  likeCount: bigint;
  commentCount: bigint;
  timestamp: bigint;
  isActive: boolean;
}

export interface RawComment {
  id: bigint;
  author: string;
  content: string;
  timestamp: bigint;
  isActive: boolean;
}

export interface RawProfile {
  user: string;
  nickname: string;
  profileCID: string;
  coverCID: string;
  bioCID: string;
  likesGiven: bigint;
  likesReceived: bigint;
  postCount: bigint;
  commentCount: bigint;
  followerCount: bigint;
  followingCount: bigint;
  isActive: boolean;
}

// =============================================================================
// MUTATION INPUT TYPES
// =============================================================================

export interface CreateCommunityInput {
  name: string;
  description: string;
  topics: string[];
  photo?: File;
  coverImage?: File;
  isClosed?: boolean;
}

export interface CreatePostInput {
  communityId: string;
  content: string;
  topic: string;
  title?: string;
  image?: File;
}

export interface CreateCommentInput {
  postId: string;
  content: string;
}

export interface CreateProfileInput {
  nickname: string;
  bio: string;
  profilePicture?: File;
  coverPhoto?: File;
}

export interface UpdateProfileInput extends CreateProfileInput {}

export interface UpdateCommunityImagesInput {
  communityId: string;
  photo?: File;
  coverImage?: File;
}
