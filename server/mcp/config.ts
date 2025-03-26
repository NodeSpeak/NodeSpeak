// HackMD MCP Server Configuration
export const HACKMD_CONFIG = {
  // HackMD API endpoints
  API_URL: process.env.HACKMD_API_URL || 'https://api.hackmd.io/v1',
  
  // Authentication settings
  CLIENT_ID: process.env.HACKMD_CLIENT_ID || '',
  CLIENT_SECRET: process.env.HACKMD_CLIENT_SECRET || '',
  
  // Integration settings
  CALLBACK_URL: process.env.HACKMD_CALLBACK_URL || 'http://localhost:3000/api/mcp/hackmd/callback',
  
  // Rate limiting
  RATE_LIMIT: parseInt(process.env.HACKMD_RATE_LIMIT || '60'),
  
  // Caching options
  CACHE_TTL: parseInt(process.env.HACKMD_CACHE_TTL || '300'), // in seconds
}

// MCP Server configuration
export const MCP_CONFIG = {
  PORT: parseInt(process.env.MCP_PORT || '3001'),
  HOST: process.env.MCP_HOST || 'localhost',
  
  // Session
  SESSION_SECRET: process.env.MCP_SESSION_SECRET || 'nodespeak-hackmd-session-secret',
  
  // Logging
  LOG_LEVEL: process.env.MCP_LOG_LEVEL || 'info',
}
