import { NextRequest, NextResponse } from 'next/server';

// =============================================================================
// CONFIGURACIÓN
// =============================================================================

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;
const PINATA_JSON_URL = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';

// Límite de tamaño para JSON (1MB)
const MAX_JSON_SIZE = 1 * 1024 * 1024;

// =============================================================================
// HANDLER PRINCIPAL
// =============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // -------------------------------------------------------------------------
    // 1. Validar configuración
    // -------------------------------------------------------------------------
    if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
      console.error('[API/IPFS-JSON] Pinata credentials not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'IPFS service not configured',
        },
        { status: 503 }
      );
    }

    // -------------------------------------------------------------------------
    // 2. Parsear body
    // -------------------------------------------------------------------------
    let body: { data: unknown; filename?: string };
    try {
      const text = await request.text();

      // Validar tamaño
      if (text.length > MAX_JSON_SIZE) {
        return NextResponse.json(
          {
            success: false,
            error: `JSON too large. Maximum size is ${MAX_JSON_SIZE / 1024}KB`,
          },
          { status: 413 }
        );
      }

      body = JSON.parse(text);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON body',
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------------------------------
    // 3. Validar datos
    // -------------------------------------------------------------------------
    const { data, filename = 'data.json' } = body;

    if (data === undefined || data === null) {
      return NextResponse.json(
        {
          success: false,
          error: 'No data provided',
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------------------------------
    // 4. Enviar a Pinata
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
          },
        },
        pinataOptions: {
          cidVersion: 1,
        },
      }),
    });

    // -------------------------------------------------------------------------
    // 5. Procesar respuesta
    // -------------------------------------------------------------------------
    if (!pinataResponse.ok) {
      const errorText = await pinataResponse.text();
      console.error('[API/IPFS-JSON] Pinata error:', {
        status: pinataResponse.status,
        error: errorText,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to upload JSON to IPFS',
        },
        { status: 502 }
      );
    }

    const pinataData = await pinataResponse.json();
    const duration = Date.now() - startTime;

    console.log('[API/IPFS-JSON] Upload successful:', {
      cid: pinataData.IpfsHash,
      size: pinataData.PinSize,
      duration: `${duration}ms`,
    });

    // -------------------------------------------------------------------------
    // 6. Retornar respuesta exitosa
    // -------------------------------------------------------------------------
    return NextResponse.json({
      success: true,
      cid: pinataData.IpfsHash,
      size: pinataData.PinSize,
      timestamp: pinataData.Timestamp,
    });
  } catch (error) {
    console.error('[API/IPFS-JSON] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
