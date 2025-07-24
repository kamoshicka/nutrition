import { render } from '@testing-library/react';
import Loading from '../loading';

// Mock the CategoryPageSkeleton component
jest.mock('@/components/ui/skeletons/CategoryPageSkeleton', () => {
  return function MockCategoryPageSkeleton() {
    return <div data-testid="mock-category-page-skeleton">Category Page Skeleton</div>;
  };
});

describe('Category Page Loading component', () => {
  it('renders the CategoryPageSkeleton component', () => {
    const { getByTestId } = render(<Loading />);
    
    // Check if the CategoryPageSkeleton is rendered
    expect(getByTestId('mock-category-page-skeleton')).toBeInTheDocument();
  });
});