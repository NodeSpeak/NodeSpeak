/**
 * IPFS Health Check API Route
 *
 * Provides a health check endpoint to verify IPFS service configuration
 * and connectivity. Useful for monitoring and debugging.
 *
 * @endpoint GET /api/ipfs/health
 * @returns { status: 'healthy' | 'degraded' | 'unhealthy', configured: boolean, ... }
 */

import { NextResponse } from 'next/server';
import type { IPFSHealthResponse } from '@/types/ipfs';

// =============================================================================
// CONFIGURATION
// =============================================================================

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;
const PINATA_TEST_AUTH_URL = 'https://api.pinata.cloud/data/testAuthentication';

// =============================================================================
// MAIN HANDLER
// =============================================================================

export async function GET(): Promise<NextResponse<IPFSHealthResponse>> {
  const timestamp = new Date().toISOString();

  // Check if credentials are configured
  const configured = !!(PINATA_API_KEY && PINATA_SECRET_API_KEY);

  if (!configured) {
    return NextResponse.json({
      status: 'unhealthy',
      configured: false,
      timestamp,
      details: {
        pinataConnected: false,
      },
    });
  }

  // Test Pinata connectivity
  try {
    const response = await fetch(PINATA_TEST_AUTH_URL, {
      method: 'GET',
      headers: {
        pinata_api_key: PINATA_API_KEY!,
        pinata_secret_api_key: PINATA_SECRET_API_KEY!,
      },
    });

    const pinataConnected = response.ok;

    return NextResponse.json({
      status: pinataConnected ? 'healthy' : 'degraded',
      configured: true,
      timestamp,
      details: {
        pinataConnected,
        lastCheck: timestamp,
      },
    });
  } catch (error) {
    console.error('[API/IPFS-Health] Connectivity test failed:', error);

    return NextResponse.json({
      status: 'degraded',
      configured: true,
      timestamp,
      details: {
        pinataConnected: false,
        lastCheck: timestamp,
      },
    });
  }
}

// =============================================================================
// ROUTE CONFIGURATION
// =============================================================================

export const dynamic = 'force-dynamic';
