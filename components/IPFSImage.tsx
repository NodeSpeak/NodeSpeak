"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useIPFSFile } from '@/hooks/queries/useIPFSFile';

export interface IPFSImageProps {
  /** The IPFS CID to load. Pass null to show fallback. */
  cid: string | null;
  /** Alt text for the image */
  alt: string;
  /** CSS classes for the image element */
  className?: string;
  /** Custom fallback when image fails to load or CID is null */
  fallback?: React.ReactNode;
  /** Callback when image loads successfully */
  onLoad?: () => void;
  /** Callback when image fails to load */
  onError?: () => void;
  /** Image width attribute */
  width?: number | string;
  /** Image height attribute */
  height?: number | string;
  /** Loading attribute for native lazy loading */
  loading?: 'lazy' | 'eager';
  /** Object fit style */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

/**
 * IPFS Image component with persistent caching
 *
 * Features:
 * - Uses React Query + IndexedDB for persistent caching
 * - Multi-gateway fallback handled internally
 * - Automatic Blob URL management with proper cleanup
 * - Loading spinner and customizable fallback
 * - SSR-safe
 *
 * @example
 * ```tsx
 * <IPFSImage
 *   cid="QmXxx..."
 *   alt="Profile picture"
 *   className="w-16 h-16 rounded-full"
 *   fallback={<DefaultAvatar />}
 * />
 * ```
 */
export const IPFSImage: React.FC<IPFSImageProps> = ({
  cid,
  alt,
  className = '',
  fallback,
  onLoad,
  onError,
  width,
  height,
  loading = 'lazy',
  objectFit = 'cover',
}) => {
  const { blob, isLoading, isError } = useIPFSFile(cid);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Create and cleanup object URL when blob changes
  useEffect(() => {
    if (blob) {
      const url = URL.createObjectURL(blob);
      setObjectUrl(url);
      setImageError(false);

      // Cleanup on unmount or when blob changes
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setObjectUrl(null);
    }
  }, [blob]);

  // Handle image load success
  const handleLoad = useCallback(() => {
    setImageError(false);
    onLoad?.();
  }, [onLoad]);

  // Handle image load error
  const handleError = useCallback(() => {
    setImageError(true);
    onError?.();
  }, [onError]);

  // Default fallback component
  const defaultFallback = (
    <div
      className={`${className} flex items-center justify-center bg-slate-200 dark:bg-slate-700`}
      style={{ width, height }}
    >
      <svg
        className="w-8 h-8 text-slate-400 dark:text-slate-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
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
        className={`${className} flex items-center justify-center bg-slate-200 dark:bg-slate-700 animate-pulse`}
        style={{ width, height }}
      >
        <div className="w-6 h-6 border-2 border-slate-400 dark:border-slate-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Error state or no blob
  if (isError || !objectUrl || imageError) {
    return <>{fallback ?? defaultFallback}</>;
  }

  return (
    <img
      src={objectUrl}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading={loading}
      onLoad={handleLoad}
      onError={handleError}
      style={{ objectFit }}
    />
  );
};

export default IPFSImage;
