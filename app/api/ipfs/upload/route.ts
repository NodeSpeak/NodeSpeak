/**
 * IPFS File Upload API Route
 *
 * Server-side proxy for uploading files to IPFS via Pinata.
 * Credentials are stored securely in environment variables.
 *
 * @endpoint POST /api/ipfs/upload
 * @body FormData with 'file' field
 * @returns { success: boolean, cid?: string, size?: number, error?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import type {
  IPFSUploadResponse,
  IPFSErrorResponse,
  IPFSErrorCode,
  PinataUploadResponse,
  FileUploadConfig,
} from '@/types/ipfs';

// =============================================================================
// CONFIGURATION
// =============================================================================

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;
const PINATA_UPLOAD_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';

/**
 * File upload configuration
 * Adjust these values based on your requirements
 */
const CONFIG: FileUploadConfig = {
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

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create a standardized error response
 */
function createErrorResponse(
  error: string,
  code: IPFSErrorCode,
  status: number
): NextResponse<IPFSErrorResponse> {
  return NextResponse.json(
    {
      success: false as const,
      error,
      code,
    },
    { status }
  );
}

/**
 * Create a standardized success response
 */
function createSuccessResponse(
  data: Omit<IPFSUploadResponse, 'success'>
): NextResponse<IPFSUploadResponse> {
  return NextResponse.json({
    success: true as const,
    ...data,
  });
}

/**
 * Validate uploaded file
 */
function validateFile(file: File | null): { valid: true } | { valid: false; error: string; code: IPFSErrorCode } {
  if (!file) {
    return { valid: false, error: 'No file provided', code: 'NO_FILE' };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty', code: 'FILE_EMPTY' };
  }

  if (file.size > CONFIG.maxFileSize) {
    const maxMB = CONFIG.maxFileSize / 1024 / 1024;
    return {
      valid: false,
      error: `File too large. Maximum size is ${maxMB}MB`,
      code: 'FILE_TOO_LARGE',
    };
  }

  // Only validate MIME type if the file has one and we have restrictions
  if (file.type && CONFIG.allowedMimeTypes.length > 0) {
    if (!CONFIG.allowedMimeTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type not allowed: ${file.type}. Allowed types: ${CONFIG.allowedMimeTypes.join(', ')}`,
        code: 'INVALID_MIME_TYPE',
      };
    }
  }

  return { valid: true };
}

/**
 * Format file size for logging
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<IPFSUploadResponse | IPFSErrorResponse>> {
  const startTime = Date.now();
  const requestId = crypto.randomUUID().slice(0, 8);

  try {
    // -------------------------------------------------------------------------
    // 1. Validate server configuration
    // -------------------------------------------------------------------------
    if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
      console.error(`[API/IPFS:${requestId}] Pinata credentials not configured`);
      return createErrorResponse(
        'IPFS service not configured. Please set PINATA_API_KEY and PINATA_SECRET_API_KEY.',
        'SERVICE_UNAVAILABLE',
        503
      );
    }

    // -------------------------------------------------------------------------
    // 2. Parse FormData
    // -------------------------------------------------------------------------
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error) {
      console.error(`[API/IPFS:${requestId}] FormData parse error:`, error);
      return createErrorResponse(
        'Invalid form data. Expected multipart/form-data with a "file" field.',
        'INVALID_FORM_DATA',
        400
      );
    }

    const file = formData.get('file') as File | null;

    // -------------------------------------------------------------------------
    // 3. Validate file
    // -------------------------------------------------------------------------
    const validation = validateFile(file);
    if (!validation.valid) {
      console.warn(`[API/IPFS:${requestId}] Validation failed: ${validation.error}`);
      return createErrorResponse(validation.error, validation.code,
        validation.code === 'FILE_TOO_LARGE' ? 413 :
        validation.code === 'INVALID_MIME_TYPE' ? 415 : 400
      );
    }

    // TypeScript now knows file is not null
    const validFile = file!;

    console.log(`[API/IPFS:${requestId}] Processing upload:`, {
      name: validFile.name,
      type: validFile.type || 'unknown',
      size: formatBytes(validFile.size),
    });

    // -------------------------------------------------------------------------
    // 4. Prepare Pinata request
    // -------------------------------------------------------------------------
    const pinataFormData = new FormData();
    pinataFormData.append('file', validFile);

    // Add metadata for better organization in Pinata dashboard
    const metadata = JSON.stringify({
      name: validFile.name || `upload-${requestId}`,
      keyvalues: {
        uploadedAt: new Date().toISOString(),
        originalSize: validFile.size.toString(),
        mimeType: validFile.type || 'application/octet-stream',
        source: 'nodespeak',
      },
    });
    pinataFormData.append('pinataMetadata', metadata);

    // Use CIDv1 for better compatibility
    const pinataOptions = JSON.stringify({
      cidVersion: 1,
    });
    pinataFormData.append('pinataOptions', pinataOptions);

    // -------------------------------------------------------------------------
    // 5. Send to Pinata
    // -------------------------------------------------------------------------
    const pinataResponse = await fetch(PINATA_UPLOAD_URL, {
      method: 'POST',
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_API_KEY,
      },
      body: pinataFormData,
    });

    // -------------------------------------------------------------------------
    // 6. Handle Pinata response
    // -------------------------------------------------------------------------
    if (!pinataResponse.ok) {
      const errorText = await pinataResponse.text();
      console.error(`[API/IPFS:${requestId}] Pinata error:`, {
        status: pinataResponse.status,
        statusText: pinataResponse.statusText,
        error: errorText,
      });

      // Map Pinata errors to appropriate responses
      if (pinataResponse.status === 401) {
        return createErrorResponse(
          'IPFS service authentication failed. Please check API credentials.',
          'SERVICE_UNAVAILABLE',
          503
        );
      }

      if (pinataResponse.status === 429) {
        return createErrorResponse(
          'IPFS service rate limit exceeded. Please try again later.',
          'RATE_LIMITED',
          429
        );
      }

      return createErrorResponse(
        'Failed to upload to IPFS. Please try again.',
        'UPLOAD_FAILED',
        502
      );
    }

    const pinataData: PinataUploadResponse = await pinataResponse.json();
    const duration = Date.now() - startTime;

    console.log(`[API/IPFS:${requestId}] Upload successful:`, {
      cid: pinataData.IpfsHash,
      size: formatBytes(pinataData.PinSize),
      duration: `${duration}ms`,
    });

    // -------------------------------------------------------------------------
    // 7. Return success response
    // -------------------------------------------------------------------------
    return createSuccessResponse({
      cid: pinataData.IpfsHash,
      size: pinataData.PinSize,
      timestamp: pinataData.Timestamp,
    });

  } catch (error) {
    console.error(`[API/IPFS:${requestId}] Unexpected error:`, error);
    return createErrorResponse(
      'Internal server error. Please try again.',
      'INTERNAL_ERROR',
      500
    );
  }
}

// =============================================================================
// ROUTE CONFIGURATION
// =============================================================================

/**
 * Configure the route segment
 * - dynamic: force-dynamic ensures the route is always executed on the server
 * - maxDuration: extend timeout for large file uploads (Vercel Pro/Enterprise)
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds for large uploads
