import { ApiError, createErrorResponse, ApiErrors } from '@/lib/api-errors';

describe('API Error Utilities', () => {
  describe('ApiError class', () => {
    it('creates an error with the correct properties', () => {
      const error = new ApiError('Test error message', 'test_error', 400, { foo: 'bar' });
      
      expect(error.message).toBe('Test error message');
      expect(error.code).toBe('test_error');
      expect(error.status).toBe(400);
      expect(error.details).toEqual({ foo: 'bar' });
      expect(error.name).toBe('ApiError');
    });
    
    it('converts to a standard response format', () => {
      const error = new ApiError('Test error message', 'test_error', 400, { foo: 'bar' });
      const response = error.toResponse();
      
      expect(response).toEqual({
        error: {
          code: 'test_error',
          message: 'Test error message',
          details: { foo: 'bar' }
        }
      });
    });
    
    it('handles missing details', () => {
      const error = new ApiError('Test error message', 'test_error', 400);
      const response = error.toResponse();
      
      expect(response).toEqual({
        error: {
          code: 'test_error',
          message: 'Test error message',
          details: undefined
        }
      });
    });
  });
  
  describe('createErrorResponse function', () => {
    it('handles ApiError instances correctly', () => {
      const apiError = new ApiError('API error', 'api_error', 403);
      const response = createErrorResponse(apiError);
      
      expect(response.status).toBe(403);
    });
    
    it('handles standard Error instances', async () => {
      const stdError = new Error('Standard error');
      const response = createErrorResponse(stdError);
      
      expect(response.status).toBe(500);
      
      const body = await response.json();
      expect(body.error.message).toBe('Standard error');
      expect(body.error.code).toBe('internal_server_error');
    });
    
    it('handles non-Error objects', async () => {
      const nonError = 'Just a string';
      const response = createErrorResponse(nonError);
      
      expect(response.status).toBe(500);
      
      const body = await response.json();
      expect(body.error.message).toBe('予期しないエラーが発生しました');
      expect(body.error.code).toBe('internal_server_error');
    });
    
    it('respects the default status parameter', async () => {
      const stdError = new Error('Standard error');
      const response = createErrorResponse(stdError, 400);
      
      expect(response.status).toBe(400);
    });
  });
  
  describe('ApiErrors factory', () => {
    it('creates not found errors', () => {
      const error = ApiErrors.notFound('テスト');
      
      expect(error.message).toBe('テストが見つかりません');
      expect(error.code).toBe('not_found');
      expect(error.status).toBe(404);
    });
    
    it('creates invalid request errors', () => {
      const error = ApiErrors.invalidRequest('無効なパラメータ');
      
      expect(error.message).toBe('無効なパラメータ');
      expect(error.code).toBe('invalid_request');
      expect(error.status).toBe(400);
    });
    
    it('creates server errors', () => {
      const error = ApiErrors.serverError('データベースエラー');
      
      expect(error.message).toBe('データベースエラー');
      expect(error.code).toBe('server_error');
      expect(error.status).toBe(500);
    });
    
    it('uses default messages when not provided', () => {
      const invalidReqError = ApiErrors.invalidRequest();
      const serverError = ApiErrors.serverError();
      
      expect(invalidReqError.message).toBe('無効なリクエストです');
      expect(serverError.message).toBe('サーバーエラーが発生しました');
    });
  });
});