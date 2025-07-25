import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GlobalError from '../error';

// Mock console.error to prevent test output noise
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Mock Next.js Link component
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid="mock-link">
      {children}
    </a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

describe('GlobalError Page', () => {
  it('renders the error page correctly', () => {
    const mockReset = jest.fn();
    const mockError = new Error('Test error');
    
    render(<GlobalError error={mockError} reset={mockReset} />);
    
    // Check for main elements
    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    
    // Check for description text
    expect(
      screen.getByText('申し訳ありませんが、予期しないエラーが発生しました。問題が解決しない場合は、後でもう一度お試しください。')
    ).toBeInTheDocument();
    
    // Check for retry button
    const retryButton = screen.getByText('再試行');
    expect(retryButton).toBeInTheDocument();
    
    // Check for home link
    const homeLink = screen.getByTestId('mock-link');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
    expect(homeLink).toHaveTextContent('ホームに戻る');
  });
  
  it('calls reset function when retry button is clicked', () => {
    const mockReset = jest.fn();
    const mockError = new Error('Test error');
    
    render(<GlobalError error={mockError} reset={mockReset} />);
    
    const retryButton = screen.getByText('再試行');
    fireEvent.click(retryButton);
    
    expect(mockReset).toHaveBeenCalledTimes(1);
  });
});