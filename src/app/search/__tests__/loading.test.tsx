import { render } from '@testing-library/react';
import Loading from '../loading';

// Mock the SearchResultsSkeleton component
jest.mock('@/components/ui/skeletons/SearchResultsSkeleton', () => {
  return function MockSearchResultsSkeleton() {
    return <div data-testid="mock-search-results-skeleton">Search Results Skeleton</div>;
  };
});

describe('Search Loading component', () => {
  it('renders the SearchResultsSkeleton component', () => {
    const { getByTestId } = render(<Loading />);
    
    // Check if the SearchResultsSkeleton is rendered
    expect(getByTestId('mock-search-results-skeleton')).toBeInTheDocument();
  });
});