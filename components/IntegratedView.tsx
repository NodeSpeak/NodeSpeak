"use client";

/**
 * IntegratedView - Modular Forum View Component
 *
 * This file re-exports the refactored IntegratedView from the modular architecture.
 * The original 2500+ line component has been split into smaller, focused components
 * for better maintainability, testability, and code organization.
 *
 * @see components/forum/integrated-view/ for the modular implementation
 *
 * New Architecture:
 * - IntegratedViewContainer: Main orchestrator with business logic
 * - useIntegratedViewState: Centralized state management with useReducer
 * - PostFeed, PostCard, CommentsSection: Post-related components
 * - CommunityExplorerPanel, CommunityCard, CommunityHeader: Community components
 * - CreatePostPanel, MatrixEditor: Content creation components
 * - FormattedContent: Safe HTML rendering with DOMPurify
 */

// Re-export the main container as IntegratedView for backward compatibility
export { IntegratedViewContainer as IntegratedView } from "./forum/integrated-view";

// Also export as default for flexibility
export { IntegratedViewContainer as default } from "./forum/integrated-view";

// Re-export types for consumers that import them from here
export type {
  Community,
  Post,
  Comment,
  Topic,
  IntegratedViewProps,
} from "./forum/integrated-view";
