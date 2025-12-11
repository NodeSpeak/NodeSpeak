"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useIPFSFile } from '@/hooks/queries/useIPFSFile';

export interface IPFSVideoProps {
  /** The IPFS CID to load. Pass null to show fallback. */
  cid: string | null;
  /** CSS classes for the video element */
  className?: string;
  /** Custom fallback when video fails to load or CID is null */
  fallback?: React.ReactNode;
  /** Callback when video loads successfully */
  onLoad?: () => void;
  /** Callback when video fails to load */
  onError?: () => void;
  /** Video width attribute */
  width?: number | string;
  /** Video height attribute */
  height?: number | string;
  /** Show video controls */
  controls?: boolean;
  /** Autoplay the video */
  autoPlay?: boolean;
  /** Loop the video */
  loop?: boolean;
  /** Mute the video */
  muted?: boolean;
  /** Play inline on mobile */
  playsInline?: boolean;
  /** Poster image URL (optional) */
  poster?: string;
  /** Preload behavior */
  preload?: 'auto' | 'metadata' | 'none';
}

/**
 * IPFS Video component with persistent caching
 *
 * Features:
 * - Uses React Query + IndexedDB for persistent caching
 * - Multi-gateway fallback handled internally
 * - Automatic Blob URL management with proper cleanup
 * - Loading spinner and customizable fallback
 * - Full video controls support
 * - SSR-safe
 *
 * @example
 * ```tsx
 * <IPFSVideo
 *   cid="QmXxx..."
 *   className="w-full max-w-2xl rounded-lg"
 *   controls
 *   fallback={<VideoPlaceholder />}
 * />
 * ```
 */
export const IPFSVideo: React.FC<IPFSVideoProps> = ({
  cid,
  className = '',
  fallback,
  onLoad,
  onError,
  width,
  height,
  controls = true,
  autoPlay = false,
  loop = false,
  muted = false,
  playsInline = true,
  poster,
  preload = 'metadata',
}) => {
  const { blob, isLoading, isError } = useIPFSFile(cid);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Create and cleanup object URL when blob changes
  useEffect(() => {
    if (blob) {
      const url = URL.createObjectURL(blob);
      setObjectUrl(url);
      setVideoError(false);

      // Cleanup on unmount or when blob changes
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setObjectUrl(null);
    }
  }, [blob]);

  // Handle video load success
  const handleLoadedData = useCallback(() => {
    setVideoError(false);
    onLoad?.();
  }, [onLoad]);

  // Handle video load error
  const handleError = useCallback(() => {
    setVideoError(true);
    onError?.();
  }, [onError]);

  // Default fallback component
  const defaultFallback = (
    <div
      className={`${className} flex items-center justify-center bg-slate-200 dark:bg-slate-700`}
      style={{ width, height }}
    >
      <svg
        className="w-12 h-12 text-slate-400 dark:text-slate-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
    </div>
  );

  // No CID provided
  if (!cid) {
    return <>{fallback ?? defaultFallback}</>;
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-slate-900/90`}
        style={{ width, height }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span className="text-white/70 text-sm">Loading video...</span>
        </div>
      </div>
    );
  }

  // Error state or no blob
  if (isError || !objectUrl || videoError) {
    return <>{fallback ?? defaultFallback}</>;
  }

  return (
    <video
      ref={videoRef}
      src={objectUrl}
      className={className}
      width={width}
      height={height}
      controls={controls}
      autoPlay={autoPlay}
      loop={loop}
      muted={muted}
      playsInline={playsInline}
      poster={poster}
      preload={preload}
      onLoadedData={handleLoadedData}
      onError={handleError}
    />
  );
};

export default IPFSVideo;
