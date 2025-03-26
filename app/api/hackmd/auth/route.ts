import { NextRequest, NextResponse } from 'next/server';

// Configuración de OAuth para HackMD
const HACKMD_CLIENT_ID = process.env.HACKMD_CLIENT_ID || 'your-client-id';
const HACKMD_CLIENT_SECRET = process.env.HACKMD_CLIENT_SECRET || 'your-client-secret';
const HACKMD_REDIRECT_URI = process.env.HACKMD_REDIRECT_URI || 'http://localhost:3000/api/hackmd/callback';
const HACKMD_AUTH_URL = 'https://hackmd.io/oauth2/authorize';

export async function GET(request: NextRequest) {
  // Generamos un estado aleatorio para proteger contra ataques CSRF
  const state = Math.random().toString(36).substring(2, 15);
  
  // Guardamos el estado en una cookie
  const authUrl = new URL(HACKMD_AUTH_URL);
  authUrl.searchParams.append('client_id', HACKMD_CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', HACKMD_REDIRECT_URI);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('state', state);
  authUrl.searchParams.append('scope', 'user:email user:write note:write note:read team:write team:read');
  
  // Creamos la respuesta y establecemos la cookie
  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set('hackmd_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10, // 10 minutos
    path: '/',
  });
  
  return response;
}
