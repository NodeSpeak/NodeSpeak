/**
 * IPFS JSON Upload API Route
 *
 * Server-side proxy for uploading JSON data to IPFS via Pinata.
 * Uses Pinata's dedicated JSON pinning endpoint for optimal performance.
 * Credentials are stored securely in environment variables.
 *
 * @endpoint POST /api/ipfs/upload-json
 * @body { data: any, filename?: string }
 * @returns { success: boolean, cid?: string, size?: number, error?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import type {
  IPFSUploadResponse,
  IPFSErrorResponse,
  IPFSErrorCode,
  PinataUploadResponse,
  UploadJSONRequest,
  JSONUploadConfig,
} from '@/types/ipfs';

// =============================================================================
// CONFIGURATION
// =============================================================================

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;
const PINATA_JSON_URL = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';

/**
 * JSON upload configuration
 */
const CONFIG: JSONUploadConfig = {
  maxJsonSize: 1 * 1024 * 1024, // 1MB
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
 * Format bytes for logging
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
      console.error(`[API/IPFS-JSON:${requestId}] Pinata credentials not configured`);
      return createErrorResponse(
        'IPFS service not configured. Please set PINATA_API_KEY and PINATA_SECRET_API_KEY.',
        'SERVICE_UNAVAILABLE',
        503
      );
    }

    // -------------------------------------------------------------------------
    // 2. Parse and validate request body
    // -------------------------------------------------------------------------
    let body: UploadJSONRequest;
    let rawText: string;

    try {
      rawText = await request.text();

      // Validate size before parsing
      if (rawText.length > CONFIG.maxJsonSize) {
        const maxKB = CONFIG.maxJsonSize / 1024;
        return createErrorResponse(
          `JSON payload too large. Maximum size is ${maxKB}KB`,
          'JSON_TOO_LARGE',
          413
        );
      }

      body = JSON.parse(rawText);
    } catch (error) {
      console.error(`[API/IPFS-JSON:${requestId}] JSON parse error:`, error);
      return createErrorResponse(
        'Invalid JSON body. Expected { data: any, filename?: string }',
        'INVALID_JSON',
        400
      );
    }

    // -------------------------------------------------------------------------
    // 3. Validate data
    // -------------------------------------------------------------------------
    const { data, filename = 'data.json' } = body;

    if (data === undefined || data === null) {
      return createErrorResponse(
        'No data provided. Expected { data: any } in request body.',
        'NO_DATA',
        400
      );
    }

    const dataSize = JSON.stringify(data).length;
    console.log(`[API/IPFS-JSON:${requestId}] Processing upload:`, {
      filename,
      dataType: typeof data,
      size: formatBytes(dataSize),
    });

    // -------------------------------------------------------------------------
    // 4. Send to Pinata
    // -------------------------------------------------------------------------
    const pinataResponse = await fetch(PINATA_JSON_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_API_KEY,
      },
      body: JSON.stringify({
        pinataContent: data,
        pinataMetadata: {
          name: filename,
          keyvalues: {
            uploadedAt: new Date().toISOString(),
            type: 'json',
            source: 'nodespeak',
          },
        },
        pinataOptions: {
          cidVersion: 1,
        },
      }),
    });

    // -------------------------------------------------------------------------
    // 5. Handle Pinata response
    // -------------------------------------------------------------------------
    if (!pinataResponse.ok) {
      const errorText = await pinataResponse.text();
      console.error(`[API/IPFS-JSON:${requestId}] Pinata error:`, {
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
        'Failed to upload JSON to IPFS. Please try again.',
        'UPLOAD_FAILED',
        502
      );
    }

    const pinataData: PinataUploadResponse = await pinataResponse.json();
    const duration = Date.now() - startTime;

    console.log(`[API/IPFS-JSON:${requestId}] Upload successful:`, {
      cid: pinataData.IpfsHash,
      size: formatBytes(pinataData.PinSize),
      duration: `${duration}ms`,
    });

    // -------------------------------------------------------------------------
    // 6. Return success response
    // -------------------------------------------------------------------------
    return createSuccessResponse({
      cid: pinataData.IpfsHash,
      size: pinataData.PinSize,
      timestamp: pinataData.Timestamp,
    });

  } catch (error) {
    console.error(`[API/IPFS-JSON:${requestId}] Unexpected error:`, error);
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
 */
export const dynamic = 'force-dynamic';
