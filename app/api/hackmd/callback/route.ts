import { NextRequest, NextResponse } from 'next/server';

// Configuración de OAuth para HackMD
const HACKMD_CLIENT_ID = process.env.HACKMD_CLIENT_ID || 'your-client-id';
const HACKMD_CLIENT_SECRET = process.env.HACKMD_CLIENT_SECRET || 'your-client-secret';
const HACKMD_REDIRECT_URI = process.env.HACKMD_REDIRECT_URI || 'http://localhost:3000/api/hackmd/callback';
const HACKMD_TOKEN_URL = 'https://hackmd.io/oauth2/token';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  
  // Verificamos si hay algún error
  if (error) {
    return new NextResponse(
      JSON.stringify({ 
        error: error,
        message: 'Error durante la autenticación de HackMD'
      }),
      { status: 400 }
    );
  }
  
  // Obtenemos el estado almacenado en la cookie
  const storedState = request.cookies.get('hackmd_oauth_state')?.value;
  
  // Verificamos que el estado recibido coincida con el almacenado
  if (!state || !storedState || state !== storedState) {
    return new NextResponse(
      JSON.stringify({ 
        error: 'invalid_state',
        message: 'El estado no coincide, posible ataque CSRF'
      }),
      { status: 400 }
    );
  }
  
  // Verificamos que tengamos el código de autorización
  if (!code) {
    return new NextResponse(
      JSON.stringify({ 
        error: 'missing_code',
        message: 'No se recibió el código de autorización'
      }),
      { status: 400 }
    );
  }
  
  try {
    // Intercambiamos el código por un token de acceso
    const tokenResponse = await fetch(HACKMD_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: HACKMD_CLIENT_ID,
        client_secret: HACKMD_CLIENT_SECRET,
        redirect_uri: HACKMD_REDIRECT_URI
      })
    });
    
    if (!tokenResponse.ok) {
      throw new Error('Error al obtener el token de acceso');
    }
    
    const tokenData = await tokenResponse.json();
    
    // Almacenamos el token en una cookie httpOnly para mayor seguridad
    const response = NextResponse.redirect(new URL('/import/hackmd', request.url));
    
    // Establecemos cookies para el token de acceso y refresh token
    response.cookies.set('hackmd_access_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: tokenData.expires_in,
      path: '/',
    });
    
    if (tokenData.refresh_token) {
      response.cookies.set('hackmd_refresh_token', tokenData.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30, // 30 días
        path: '/',
      });
    }
    
    // Eliminamos la cookie de estado ya que ya no la necesitamos
    response.cookies.set('hackmd_oauth_state', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Error durante el intercambio de código por token:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'token_exchange_error',
        message: 'Error durante el intercambio de código por token'
      }),
      { status: 500 }
    );
  }
}
