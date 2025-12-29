import { NextRequest, NextResponse } from 'next/server';

// =============================================================================
// CONFIGURACIÓN
// =============================================================================

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;
const PINATA_UPLOAD_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';

// Límites de archivo
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/json',
  'text/plain',
  'application/pdf',
];

// =============================================================================
// VALIDACIÓN
// =============================================================================

interface ValidationResult {
  valid: boolean;
  error?: string;
}

function validateFile(file: File | null): ValidationResult {
  // Validar que existe
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Validar tamaño
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Validar tamaño mínimo (evitar archivos vacíos)
  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  // Validar tipo MIME (si está configurado)
  if (ALLOWED_MIME_TYPES.length > 0 && file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed: ${file.type}`,
    };
  }

  return { valid: true };
}

// =============================================================================
// HANDLER PRINCIPAL
// =============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // -------------------------------------------------------------------------
    // 1. Validar configuración del servidor
    // -------------------------------------------------------------------------
    if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
      console.error('[API/IPFS] Pinata credentials not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'IPFS service not configured',
        },
        { status: 503 }
      );
    }

    // -------------------------------------------------------------------------
    // 2. Parsear FormData
    // -------------------------------------------------------------------------
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid form data',
        },
        { status: 400 }
      );
    }

    const file = formData.get('file') as File | null;

    // -------------------------------------------------------------------------
    // 3. Validar archivo
    // -------------------------------------------------------------------------
    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------------------------------
    // 4. Preparar request a Pinata
    // -------------------------------------------------------------------------
    const pinataFormData = new FormData();
    pinataFormData.append('file', file!);

    // Metadata opcional
    const metadata = JSON.stringify({
      name: file!.name,
      keyvalues: {
        uploadedAt: new Date().toISOString(),
        originalSize: file!.size.toString(),
        mimeType: file!.type,
      },
    });
    pinataFormData.append('pinataMetadata', metadata);

    // Opciones de pinning
    const pinataOptions = JSON.stringify({
      cidVersion: 1,
    });
    pinataFormData.append('pinataOptions', pinataOptions);

    // -------------------------------------------------------------------------
    // 5. Enviar a Pinata
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
    // 6. Procesar respuesta
    // -------------------------------------------------------------------------
    if (!pinataResponse.ok) {
      const errorText = await pinataResponse.text();
      console.error('[API/IPFS] Pinata error:', {
        status: pinataResponse.status,
        error: errorText,
      });

      const statusCode = pinataResponse.status === 401 ? 503 : 502;
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to upload to IPFS',
        },
        { status: statusCode }
      );
    }

    const pinataData = await pinataResponse.json();
    const duration = Date.now() - startTime;

    console.log('[API/IPFS] Upload successful:', {
      cid: pinataData.IpfsHash,
      size: pinataData.PinSize,
      duration: `${duration}ms`,
    });

    // -------------------------------------------------------------------------
    // 7. Retornar respuesta exitosa
    // -------------------------------------------------------------------------
    return NextResponse.json({
      success: true,
      cid: pinataData.IpfsHash,
      size: pinataData.PinSize,
      timestamp: pinataData.Timestamp,
    });
  } catch (error) {
    console.error('[API/IPFS] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
