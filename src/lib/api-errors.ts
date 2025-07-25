import { NextResponse } from 'next/server';

/**
 * Standard API error response format
 */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * API error class for consistent error handling
 */
export class ApiError extends Error {
  code: string;
  status: number;
  details?: any;

  constructor(message: string, code: string, status: number = 500, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }

  /**
   * Convert the error to a standard API response
   */
  toResponse(): ApiErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

/**
 * Create a standard error response for API routes
 */
export function createErrorResponse(error: unknown, defaultStatus = 500): NextResponse {
  console.error('API Error:', error);
  
  if (error instanceof ApiError) {
    return NextResponse.json(error.toResponse(), { status: error.status });
  }
  
  // Handle standard errors
  const message = error instanceof Error ? error.message : '予期しないエラーが発生しました';
  
  return NextResponse.json(
    {
      error: {
        code: 'internal_server_error',
        message,
      },
    },
    { status: defaultStatus }
  );
}

/**
 * Common API errors
 */
export const ApiErrors = {
  notFound: (resource: string) => 
    new ApiError(`${resource}が見つかりません`, 'not_found', 404),
  
  invalidRequest: (message: string = '無効なリクエストです') => 
    new ApiError(message, 'invalid_request', 400),
  
  serverError: (message: string = 'サーバーエラーが発生しました') => 
    new ApiError(message, 'server_error', 500),
};