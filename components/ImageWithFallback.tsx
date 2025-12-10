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
  maxRetries?: number;
  retryDelay?: number;
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
  maxRetries = 3,
  retryDelay = 1000,
}) => {
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [urls, setUrls] = useState<string[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const attemptedUrls = useRef<Set<string>>(new Set());
  const imgRef = useRef<HTMLImageElement>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Handle image load error - try next gateway or retry
  const handleImageError = () => {
    const currentUrl = urls[currentUrlIndex];
    attemptedUrls.current.add(currentUrl);

    // Try next gateway if available
    if (currentUrlIndex < urls.length - 1) {
      setCurrentUrlIndex((prev) => prev + 1);
      setRetryCount(0); // Reset retry count for new gateway
    } else if (retryCount < maxRetries) {
      // Retry current gateway with exponential backoff
      const delay = retryDelay * Math.pow(2, retryCount);
      setRetryCount((prev) => prev + 1);
      
      retryTimeoutRef.current = setTimeout(() => {
        // Force re-render by toggling a state
        setImageLoaded(false);
        // Retry same URL
        if (imgRef.current) {
          imgRef.current.src = currentUrl;
        }
      }, delay);
    } else {
      // All gateways and retries failed
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

  // Cleanup retry timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

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
        <div className={`${className} flex items-center justify-center bg-slate-200 dark:bg-slate-700`}>
          <div className="w-6 h-6 border-2 border-slate-400 dark:border-slate-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </>
  );
};
