"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useIPFSFile } from '@/hooks/queries/useIPFSFile';
import { fetchIPFSFileWithCache } from '@/lib/ipfsClient';

export interface IPFSFileDownloadProps {
  /** The IPFS CID to load. Pass null to disable. */
  cid: string | null;
  /** Filename for the download (including extension) */
  filename: string;
  /** CSS classes for the button/link */
  className?: string;
  /** Custom children to render inside the button */
  children?: React.ReactNode;
  /** Callback when download starts */
  onDownloadStart?: () => void;
  /** Callback when download completes */
  onDownloadComplete?: () => void;
  /** Callback when download fails */
  onError?: () => void;
  /** Whether to auto-download when component mounts */
  autoDownload?: boolean;
  /** Disable the download button */
  disabled?: boolean;
}

/**
 * IPFS File Download component with persistent caching
 *
 * Features:
 * - Uses React Query + IndexedDB for persistent caching
 * - Multi-gateway fallback handled internally
 * - Triggers browser download with custom filename
 * - Loading states and error handling
 * - SSR-safe
 *
 * @example
 * ```tsx
 * <IPFSFileDownload
 *   cid="QmXxx..."
 *   filename="document.pdf"
 *   className="px-4 py-2 bg-blue-500 text-white rounded"
 * >
 *   Download PDF
 * </IPFSFileDownload>
 * ```
 */
export const IPFSFileDownload: React.FC<IPFSFileDownloadProps> = ({
  cid,
  filename,
  className = '',
  children,
  onDownloadStart,
  onDownloadComplete,
  onError,
  autoDownload = false,
  disabled = false,
}) => {
  const { blob, isLoading, isError } = useIPFSFile(cid);
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasAutoDownloaded, setHasAutoDownloaded] = useState(false);

  // Trigger the actual download
  const triggerDownload = useCallback(
    (blobToDownload: Blob) => {
      try {
        const url = URL.createObjectURL(blobToDownload);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        onDownloadComplete?.();
      } catch (error) {
        console.error('[IPFSFileDownload] Download failed:', error);
        onError?.();
      } finally {
        setIsDownloading(false);
      }
    },
    [filename, onDownloadComplete, onError]
  );

  // Auto-download when blob is available (if enabled)
  useEffect(() => {
    if (autoDownload && blob && !hasAutoDownloaded) {
      setHasAutoDownloaded(true);
      onDownloadStart?.();
      triggerDownload(blob);
    }
  }, [autoDownload, blob, hasAutoDownloaded, triggerDownload, onDownloadStart]);

  // Handle manual download click
  const handleDownload = useCallback(async () => {
    if (disabled || isDownloading || !cid) return;

    setIsDownloading(true);
    onDownloadStart?.();

    // If blob is already cached, use it directly
    if (blob) {
      triggerDownload(blob);
      return;
    }

    // Otherwise, fetch directly
    try {
      const fetchedBlob = await fetchIPFSFileWithCache(cid);
      if (fetchedBlob) {
        triggerDownload(fetchedBlob);
      } else {
        onError?.();
        setIsDownloading(false);
      }
    } catch (error) {
      console.error('[IPFSFileDownload] Fetch failed:', error);
      onError?.();
      setIsDownloading(false);
    }
  }, [disabled, isDownloading, cid, blob, triggerDownload, onDownloadStart, onError]);

  // Default button content
  const defaultContent = (
    <span className="flex items-center gap-2">
      {isLoading || isDownloading ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          <span>Download</span>
        </>
      )}
    </span>
  );

  // Disabled/error states
  const isDisabled = disabled || !cid || isError || isLoading || isDownloading;

  return (
    <button
      type="button"
      className={`${className} ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={handleDownload}
      disabled={isDisabled}
      aria-label={`Download ${filename}`}
    >
      {children ?? defaultContent}
    </button>
  );
};

export default IPFSFileDownload;
