import { MCP_CONFIG } from '../config';

// Simple logger utility
const logger = {
  info: (message: string, data?: any) => {
    if (['info', 'debug'].includes(MCP_CONFIG.LOG_LEVEL)) {
      console.log(`[INFO] ${message}`, data ? data : '');
    }
  },
  
  debug: (message: string, data?: any) => {
    if (MCP_CONFIG.LOG_LEVEL === 'debug') {
      console.log(`[DEBUG] ${message}`, data ? data : '');
    }
  },
  
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data ? data : '');
  },
  
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error ? error : '');
  }
};

export default logger;
