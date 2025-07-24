import React from 'react';
import { render, screen } from '@testing-library/react';
import NotFound from '../not-found';

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
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid="mock-link">
      {children}
    </a>
  );
});

describe('NotFound Page', () => {
  it('renders the 404 page correctly', () => {
    render(<NotFound />);
    
    // Check for main elements
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('ページが見つかりません')).toBeInTheDocument();
    
    // Check for description text
    expect(
      screen.getByText('お探しのページは存在しないか、移動または削除された可能性があります。')
    ).toBeInTheDocument();
    
    // Check for home link
    const homeLink = screen.getByTestId('mock-link');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
    expect(homeLink).toHaveTextContent('ホームに戻る');
  });
});