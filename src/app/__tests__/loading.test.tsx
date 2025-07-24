import { render, screen } from '@testing-library/react';
import Loading from '../loading';

describe('Loading component', () => {
  it('renders loading skeleton elements', () => {
    render(<Loading />);
    
    // Check for skeleton elements
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
    
    // Verify the structure
    const container = document.querySelector('.space-y-8');
    expect(container).toBeInTheDocument();
    
    // Check for CategoryCardSkeleton (indirect test through its rendered structure)
    // This assumes CategoryCardSkeleton is properly tested in its own test file
    expect(container).toContainElement(document.querySelector('.max-w-3xl'));
  });
});