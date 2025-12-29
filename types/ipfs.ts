/**
 * IPFS Types
 *
 * Shared type definitions for IPFS operations between client and server.
 * These types ensure type safety and consistency across the application.
 */

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * Base response structure for all IPFS API endpoints
 */
export interface IPFSBaseResponse {
  success: boolean;
  error?: string;
}

/**
 * Successful upload response from IPFS API
 */
export interface IPFSUploadResponse extends IPFSBaseResponse {
  success: true;
  cid: string;
  size: number;
  timestamp?: string;
}

/**
 * Error response from IPFS API
 */
export interface IPFSErrorResponse extends IPFSBaseResponse {
  success: false;
  error: string;
  code?: IPFSErrorCode;
}

/**
 * Union type for all possible IPFS API responses
 */
export type IPFSResponse = IPFSUploadResponse | IPFSErrorResponse;

// =============================================================================
// ERROR CODES
// =============================================================================

/**
 * Standardized error codes for IPFS operations
 */
export type IPFSErrorCode =
  | 'NO_FILE'
  | 'FILE_TOO_LARGE'
  | 'FILE_EMPTY'
  | 'INVALID_MIME_TYPE'
  | 'INVALID_FORM_DATA'
  | 'INVALID_JSON'
  | 'JSON_TOO_LARGE'
  | 'NO_DATA'
  | 'SERVICE_UNAVAILABLE'
  | 'UPLOAD_FAILED'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

/**
 * Map of error codes to HTTP status codes
 */
export const ERROR_STATUS_MAP: Record<IPFSErrorCode, number> = {
  NO_FILE: 400,
  FILE_TOO_LARGE: 413,
  FILE_EMPTY: 400,
  INVALID_MIME_TYPE: 415,
  INVALID_FORM_DATA: 400,
  INVALID_JSON: 400,
  JSON_TOO_LARGE: 413,
  NO_DATA: 400,
  SERVICE_UNAVAILABLE: 503,
  UPLOAD_FAILED: 502,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

// =============================================================================
// CONFIGURATION TYPES
// =============================================================================

/**
 * Configuration for file uploads
 */
export interface FileUploadConfig {
  maxFileSize: number;
  allowedMimeTypes: string[];
}

/**
 * Configuration for JSON uploads
 */
export interface JSONUploadConfig {
  maxJsonSize: number;
}

/**
 * Default configuration values
 */
export const DEFAULT_FILE_CONFIG: FileUploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/json',
    'text/plain',
    'application/pdf',
  ],
};

export const DEFAULT_JSON_CONFIG: JSONUploadConfig = {
  maxJsonSize: 1 * 1024 * 1024, // 1MB
};

// =============================================================================
// REQUEST TYPES
// =============================================================================

/**
 * Request body for JSON upload endpoint
 */
export interface UploadJSONRequest {
  data: unknown;
  filename?: string;
}

// =============================================================================
// PINATA TYPES
// =============================================================================

/**
 * Pinata API response for successful pin
 */
export interface PinataUploadResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

/**
 * Pinata metadata for uploads
 */
export interface PinataMetadata {
  name: string;
  keyvalues?: Record<string, string>;
}

/**
 * Pinata pin options
 */
export interface PinataOptions {
  cidVersion?: 0 | 1;
  wrapWithDirectory?: boolean;
}

// =============================================================================
// HEALTH CHECK TYPES
// =============================================================================

/**
 * Health check response
 */
export interface IPFSHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  configured: boolean;
  timestamp: string;
  details?: {
    pinataConnected?: boolean;
    lastCheck?: string;
  };
}
