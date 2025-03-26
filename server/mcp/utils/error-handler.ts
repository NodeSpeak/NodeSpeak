import { Response } from 'express';
import logger from './logger';

// Error types
export enum ErrorType {
  VALIDATION = 'ValidationError',
  AUTHENTICATION = 'AuthenticationError',
  AUTHORIZATION = 'AuthorizationError',
  NOT_FOUND = 'NotFoundError',
  API_ERROR = 'ApiError',
  SERVER_ERROR = 'ServerError',
  RATE_LIMIT = 'RateLimitError'
}

// Custom error class
export class MCPError extends Error {
  public status: number;
  public type: ErrorType;
  
  constructor(message: string, status: number = 500, type: ErrorType = ErrorType.SERVER_ERROR) {
    super(message);
    this.status = status;
    this.type = type;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
export const handleError = (error: any, res: Response) => {
  // Default error values
  let errorMessage = 'Internal Server Error';
  let errorType = ErrorType.SERVER_ERROR;
  let statusCode = 500;
  
  // Handle specific error types
  if (error instanceof MCPError) {
    errorMessage = error.message;
    errorType = error.type;
    statusCode = error.status;
  } else if (error.response && error.response.data) {
    // Handle HackMD API errors
    errorMessage = error.response.data.message || 'HackMD API Error';
    statusCode = error.response.status || 500;
    errorType = ErrorType.API_ERROR;
  }
  
  // Log the error
  logger.error(errorMessage, error);
  
  // Send error response
  return res.status(statusCode).json({
    success: false,
    error: {
      type: errorType,
      message: errorMessage,
      status: statusCode
    }
  });
};
