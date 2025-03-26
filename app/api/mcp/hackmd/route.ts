import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// MCP server base URL
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3001';

/**
 * Handle all API requests to HackMD MCP server
 */
export async function GET(request: NextRequest) {
  return await proxyToMcpServer(request);
}

export async function POST(request: NextRequest) {
  return await proxyToMcpServer(request);
}

export async function PUT(request: NextRequest) {
  return await proxyToMcpServer(request);
}

export async function DELETE(request: NextRequest) {
  return await proxyToMcpServer(request);
}

/**
 * Proxy requests to the MCP server
 */
async function proxyToMcpServer(request: NextRequest) {
  try {
    // Get the path after /api/mcp/hackmd
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const mcpPath = pathSegments.slice(4).join('/'); // Skip /api/mcp/hackmd
    
    // Forward the request to the MCP server
    const mcpUrl = `${MCP_SERVER_URL}/${mcpPath}${url.search}`;
    
    // Prepare headers to forward
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      // Skip host header and other headers that shouldn't be forwarded
      if (!['host', 'connection'].includes(key.toLowerCase())) {
        headers.append(key, value);
      }
    });
    
    // Forward cookies for session management
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    if (allCookies.length > 0) {
      headers.append('Cookie', allCookies.map(c => `${c.name}=${c.value}`).join('; '));
    }
    
    // Forward the request
    const mcpResponse = await fetch(mcpUrl, {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.blob() : undefined,
      redirect: 'follow',
    });
    
    // Create the response to return to the client
    const responseHeaders = new Headers();
    mcpResponse.headers.forEach((value, key) => {
      // Skip headers that Next.js will set
      if (!['content-length', 'connection', 'keep-alive'].includes(key.toLowerCase())) {
        responseHeaders.append(key, value);
      }
    });
    
    // Handle cookies from the MCP server
    const setCookieHeader = mcpResponse.headers.get('set-cookie');
    if (setCookieHeader) {
      responseHeaders.set('set-cookie', setCookieHeader);
    }
    
    // Return the response from the MCP server
    return new NextResponse(await mcpResponse.blob(), {
      status: mcpResponse.status,
      statusText: mcpResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Error proxying to MCP server:', error);
    return NextResponse.json(
      { error: 'Failed to communicate with HackMD MCP server' },
      { status: 500 }
    );
  }
}
