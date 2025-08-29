/**
 * Custom Hooks Barrel Export
 * Centralized exports for all custom React hooks
 */

// Core Video Generation Hooks
export { useVideoGeneration } from './useVideoGeneration';
export type {
  VideoGenerationState,
  VideoGenerationActions,
  UseVideoGenerationOptions,
} from './useVideoGeneration';

// Chat Session Hooks
export {
  useChatSession,
  usePromptSuggestions,
} from './useChatSession';
export type {
  ChatMessage,
  ChatSessionState,
  ChatSessionActions,
  UseChatSessionOptions,
} from './useChatSession';

// Job Status Hooks
export {
  useJobStatus,
  useMultipleJobStatus,
} from './useJobStatus';
export type {
  JobStatusData,
  JobStatusState,
  JobStatusActions,
  UseJobStatusOptions,
} from './useJobStatus';

// Cost Tracking Hooks
export {
  useCostTracking,
  useBudgetDisplay,
} from './useCostTracking';
export type {
  BudgetStatus,
  CostEstimate,
  CostTrackingState,
  CostTrackingActions,
  UseCostTrackingOptions,
} from './useCostTracking';

// Utility Hooks
export {
  useLocalStorage,
  useUserPreferences,
  useRecentPrompts,
  useSessionStorage,
} from './useLocalStorage';

export {
  useDebounce,
  useDebouncedCallback,
  useDebouncedSearch,
  useDebouncedValidation,
  useAutoSave,
} from './useDebounce';

export {
  useAsync,
  useAsyncWithCache,
  useAsyncSequence,
} from './useAsync';
export type {
  AsyncState,
  AsyncActions,
  UseAsyncOptions,
} from './useAsync';

export {
  useErrorBoundary,
  useAsyncErrorHandler,
  useSafeAsync,
} from './useErrorBoundary';
export type {
  ErrorInfo,
  ErrorBoundaryState,
  ErrorBoundaryActions,
  UseErrorBoundaryOptions,
} from './useErrorBoundary';

// Mobile Optimization Hooks
export {
  useTouchGestures,
} from './useTouchGestures';
export type {
  TouchGestureConfig,
} from './useTouchGestures';

export {
  useViewport,
  useIntersectionObserver,
  useVisibilityObserver,
} from './useViewport';
export type {
  ViewportSize,
  ViewportInfo,
  IntersectionOptions,
} from './useViewport';

export {
  usePullToRefresh,
} from './usePullToRefresh';
export type {
  PullToRefreshConfig,
  PullToRefreshState,
} from './usePullToRefresh';

export {
  useHaptics,
} from './useHaptics';
export type {
  HapticFeedbackType,
  HapticOptions,
} from './useHaptics';