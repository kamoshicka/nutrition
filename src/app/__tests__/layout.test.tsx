import { render, screen } from '@testing-library/react';
import RootLayout from '../layout';

// Mock the GlobalHeader component
jest.mock('@/components/ui/GlobalHeader', () => {
  return function MockGlobalHeader() {
    return <div data-testid="mock-global-header">Global Header</div>;
  };
});

// Mock the SearchHistoryProvider
jest.mock('@/lib/search-history', () => ({
  SearchHistoryProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-search-history-provider">{children}</div>
  ),
}));

describe('RootLayout', () => {
  it('renders the layout with header, main content, and footer', () => {
    render(
      <RootLayout>
        <div data-testid="test-content">Test Content</div>
      </RootLayout>
    );

    // Check if the header is rendered
    expect(screen.getByTestId('mock-global-header')).toBeInTheDocument();
    
    // Check if the main content is rendered
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    
    // Check if the footer is rendered with the copyright text
    expect(screen.getByText(/© 2024 クックケア/)).toBeInTheDocument();
    
    // Check if the SearchHistoryProvider is used
    expect(screen.getByTestId('mock-search-history-provider')).toBeInTheDocument();
  });
});