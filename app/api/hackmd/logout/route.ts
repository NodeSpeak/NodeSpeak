import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Creamos una respuesta y eliminamos las cookies de autenticación
  const response = NextResponse.json({ 
    success: true, 
    message: 'Sesión cerrada correctamente' 
  });
  
  // Eliminamos todas las cookies relacionadas con HackMD
  response.cookies.set('hackmd_access_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/',
  });
  
  response.cookies.set('hackmd_refresh_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/',
  });
  
  return response;
}
