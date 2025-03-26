import { NextRequest, NextResponse } from 'next/server';

const HACKMD_API_URL = 'https://api.hackmd.io/v1';

export async function GET(
  request: NextRequest,
  { params }: { params: { noteId: string } }
) {
  const { noteId } = params;
  
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
    // Obtenemos la nota específica
    const noteResponse = await fetch(`${HACKMD_API_URL}/notes/${noteId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    if (!noteResponse.ok) {
      // Si el token expiró o es inválido
      if (noteResponse.status === 401) {
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
      
      // Si la nota no existe o no tienes permisos
      if (noteResponse.status === 404) {
        return NextResponse.json({ 
          error: 'note_not_found',
          message: 'La nota no existe o no tienes permisos para acceder a ella'
        }, { status: 404 });
      }
      
      throw new Error('Error al obtener la nota');
    }
    
    const noteData = await noteResponse.json();
    
    return NextResponse.json(noteData);
  } catch (error) {
    console.error('Error al obtener nota de HackMD:', error);
    return NextResponse.json({ 
      error: 'api_error',
      message: 'Error al comunicarse con la API de HackMD'
    }, { status: 500 });
  }
}
