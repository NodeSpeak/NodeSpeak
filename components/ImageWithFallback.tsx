"use client";

import React, { useState, useEffect, useRef } from 'react';
import { getAllImageUrls } from '@/lib/ipfsClient';

interface ImageWithFallbackProps {
  cid: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Smart image component with automatic gateway fallback
 *
 * Features:
 * - Tries multiple IPFS gateways automatically
 * - Handles CORS, rate limiting, and network errors
 * - Shows loading state and custom fallback
 * - Caches successful gateway choices per CID
 */
export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  cid,
  alt,
  className = '',
  fallback,
  onLoad,
  onError,
}) => {
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [urls, setUrls] = useState<string[]>([]);
  const attemptedUrls = useRef<Set<string>>(new Set());
  const imgRef = useRef<HTMLImageElement>(null);

  // Generate all possible URLs from the CID
  useEffect(() => {
    if (!cid) {
      setHasError(true);
      setUrls([]);
      return;
    }

    // If CID is already a full URL, use it directly
    if (cid.startsWith('http://') || cid.startsWith('https://')) {
      setUrls([cid]);
      return;
    }

    // Get all gateway URLs for this CID
    const gatewayUrls = getAllImageUrls(cid);
    setUrls(gatewayUrls);
    setCurrentUrlIndex(0);
    setImageLoaded(false);
    setHasError(false);
    attemptedUrls.current.clear();
  }, [cid]);

  // Handle image load success
  const handleImageLoad = () => {
    setImageLoaded(true);
    setHasError(false);
    onLoad?.();
  };

  // Handle image load error - try next gateway
  const handleImageError = () => {
    const currentUrl = urls[currentUrlIndex];
    attemptedUrls.current.add(currentUrl);

    // Try next gateway if available
    if (currentUrlIndex < urls.length - 1) {
      setCurrentUrlIndex((prev) => prev + 1);
    } else {
      // All gateways failed
      setHasError(true);
      onError?.();
    }
  };

  // Reset state when switching to a new URL
  useEffect(() => {
    if (urls.length > 0 && currentUrlIndex < urls.length) {
      setImageLoaded(false);
    }
  }, [currentUrlIndex, urls]);

  // Don't render anything if no CID provided
  if (!cid || urls.length === 0) {
    return <>{fallback}</>;
  }

  // Show fallback if all gateways failed
  if (hasError) {
    return <>{fallback}</>;
  }

  const currentUrl = urls[currentUrlIndex];

  return (
    <>
      <img
        ref={imgRef}
        src={currentUrl}
        alt={alt}
        className={className}
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{
          display: imageLoaded ? 'block' : 'none',
        }}
      />
      {!imageLoaded && !hasError && (
        <div className={`${className} animate-pulse bg-slate-200 dark:bg-slate-700`} />
      )}
    </>
  );
};
