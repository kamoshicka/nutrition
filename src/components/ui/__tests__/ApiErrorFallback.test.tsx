import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ApiErrorFallback from '../ApiErrorFallback';

describe('ApiErrorFallback', () => {
  it('renders basic error message when error is provided', () => {
    const error = new Error('Test error message');
    
    render(<ApiErrorFallback error={error} />);
    
    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });
  
  it('renders parsed API error when error contains JSON', () => {
    const apiError = new Error(JSON.stringify({
      error: {
        code: 'api_error',
        message: 'API error occurred'
      }
    }));
    
    render(<ApiErrorFallback error={apiError} />);
    
    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    expect(screen.getByText('API error occurred')).toBeInTheDocument();
  });
  
  it('renders not found message for not_found error code', () => {
    const notFoundError = new Error(JSON.stringify({
      error: {
        code: 'not_found',
        message: 'Resource not found'
      }
    }));
    
    render(<ApiErrorFallback error={notFoundError} />);
    
    expect(screen.getByText('見つかりませんでした')).toBeInTheDocument();
    expect(screen.getByText('Resource not found')).toBeInTheDocument();
  });
  
  it('calls retry function when retry button is clicked', () => {
    const mockRetry = jest.fn();
    const error = new Error('Test error');
    
    render(<ApiErrorFallback error={error} retryAction={mockRetry} />);
    
    const retryButton = screen.getByText('再試行');
    fireEvent.click(retryButton);
    
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });
  
  it('does not show retry button when no retry function is provided', () => {
    const error = new Error('Test error');
    
    render(<ApiErrorFallback error={error} />);
    
    expect(screen.queryByText('再試行')).not.toBeInTheDocument();
  });
});