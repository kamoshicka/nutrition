import { render } from '@testing-library/react';
import Loading from '../loading';

// Mock the FoodDetailSkeleton component
jest.mock('@/components/ui/skeletons/FoodDetailSkeleton', () => {
  return function MockFoodDetailSkeleton() {
    return <div data-testid="mock-food-detail-skeleton">Food Detail Skeleton</div>;
  };
});

describe('Food Detail Loading component', () => {
  it('renders the FoodDetailSkeleton component', () => {
    const { getByTestId } = render(<Loading />);
    
    // Check if the FoodDetailSkeleton is rendered
    expect(getByTestId('mock-food-detail-skeleton')).toBeInTheDocument();
  });
});