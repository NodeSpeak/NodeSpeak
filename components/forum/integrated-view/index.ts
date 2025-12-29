/**
 * IntegratedView Module - Modular Forum View Components
 *
 * Refactored from a 2500+ line component into focused, maintainable modules.
 */

// Main container
export { IntegratedViewContainer } from "./IntegratedViewContainer";
export { IntegratedViewContainer as default } from "./IntegratedViewContainer";

// Post components
export { PostFeed } from "./PostFeed";
export { PostCard } from "./PostCard";
export { CommentsSection } from "./CommentsSection";

// Community components
export { CommunityExplorerPanel } from "./CommunityExplorerPanel";
export { CommunityCard } from "./CommunityCard";
export { CommunityHeader } from "./CommunityHeader";
export { CommunityBanner } from "./CommunityBanner";
export { ClosedCommunityNotice } from "./ClosedCommunityNotice";

// Content creation
export { CreatePostPanel } from "./CreatePostPanel";
export { MatrixEditor } from "./MatrixEditor";
export { FormattedContent } from "./FormattedContent";

// Hooks
export { useIntegratedViewState } from "./hooks/useIntegratedViewState";
export type { UseIntegratedViewStateReturn } from "./hooks/useIntegratedViewState";

// Types
export type {
  Community,
  Post,
  Comment,
  Topic,
  MemberProfile,
  IntegratedViewProps,
  CreatePostPanelProps,
  PostFeedProps,
  CommentsSectionProps,
  MatrixEditorProps,
  FormattedContentProps,
  IntegratedViewState,
  IntegratedViewAction,
} from "./types";
