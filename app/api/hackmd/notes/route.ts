import { NextRequest, NextResponse } from 'next/server';

const HACKMD_API_URL = 'https://api.hackmd.io/v1';

export async function GET(request: NextRequest) {
  // Obtenemos el token de acceso de las cookies
  const accessToken = request.cookies.get('hackmd_access_token')?.value;
  
  // Si no hay token, el usuario no está autenticado
  if (!accessToken) {
    return NextResponse.json({ 
      error: 'unauthorized',
      message: 'No has iniciado sesión en HackMD'
    }, { status: 401 });
  }
  
  try {
    // Obtenemos todas las notas del usuario
    const notesResponse = await fetch(`${HACKMD_API_URL}/notes`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    if (!notesResponse.ok) {
      // Si el token expiró o es inválido
      if (notesResponse.status === 401) {
        const response = NextResponse.json({ 
          error: 'invalid_token',
          message: 'El token de acceso ha expirado o es inválido'
        }, { status: 401 });
        
        // Limpiamos las cookies de autenticación
        response.cookies.set('hackmd_access_token', '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 0,
          path: '/',
        });
        
        return response;
      }
      
      throw new Error('Error al obtener notas');
    }
    
    const notes = await notesResponse.json();
    
    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error al obtener notas de HackMD:', error);
    return NextResponse.json({ 
      error: 'api_error',
      message: 'Error al comunicarse con la API de HackMD'
    }, { status: 500 });
  }
}
