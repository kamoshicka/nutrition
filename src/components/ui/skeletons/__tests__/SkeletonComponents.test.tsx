import React from 'react';
import { render, screen } from '@testing-library/react';
import CategoryCardSkeleton from '../CategoryCardSkeleton';
import CategoryPageSkeleton from '../CategoryPageSkeleton';
import FoodCardSkeleton from '../FoodCardSkeleton';
import FoodDetailSkeleton from '../FoodDetailSkeleton';
import SearchResultsSkeleton from '../SearchResultsSkeleton';

describe('Skeleton Components', () => {
  describe('CategoryCardSkeleton', () => {
    it('renders the correct number of skeleton cards', () => {
      render(<CategoryCardSkeleton count={3} />);
      
      // Each card has 3 skeleton elements
      const skeletonElements = screen.getAllByRole('none', { hidden: true });
      expect(skeletonElements.length).toBe(9); // 3 cards * 3 elements
    });
    
    it('renders with default count when not specified', () => {
      render(<CategoryCardSkeleton />);
      
      // Default is 6 cards with 3 skeleton elements each
      const skeletonElements = screen.getAllByRole('none', { hidden: true });
      expect(skeletonElements.length).toBe(18); // 6 cards * 3 elements
    });
  });
  
  describe('FoodCardSkeleton', () => {
    it('renders the correct number of skeleton cards', () => {
      render(<FoodCardSkeleton count={2} />);
      
      // Each card has 4 skeleton elements
      const skeletonElements = screen.getAllByRole('none', { hidden: true });
      expect(skeletonElements.length).toBe(8); // 2 cards * 4 elements
    });
    
    it('renders with default count when not specified', () => {
      render(<FoodCardSkeleton />);
      
      // Default is 8 cards with 4 skeleton elements each
      const skeletonElements = screen.getAllByRole('none', { hidden: true });
      expect(skeletonElements.length).toBe(32); // 8 cards * 4 elements
    });
  });
  
  describe('FoodDetailSkeleton', () => {
    it('renders the food detail skeleton structure', () => {
      render(<FoodDetailSkeleton />);
      
      // Check that skeleton elements are rendered
      const skeletonElements = screen.getAllByRole('none', { hidden: true });
      expect(skeletonElements.length).toBeGreaterThan(10); // Many skeleton elements in this complex component
    });
  });
  
  describe('SearchResultsSkeleton', () => {
    it('renders the search results skeleton structure', () => {
      render(<SearchResultsSkeleton />);
      
      // Check that skeleton elements are rendered
      const skeletonElements = screen.getAllByRole('none', { hidden: true });
      expect(skeletonElements.length).toBeGreaterThan(10); // Many skeleton elements in this complex component
    });
  });
  
  describe('CategoryPageSkeleton', () => {
    it('renders the category page skeleton structure', () => {
      render(<CategoryPageSkeleton />);
      
      // Check that skeleton elements are rendered
      const skeletonElements = screen.getAllByRole('none', { hidden: true });
      expect(skeletonElements.length).toBeGreaterThan(10); // Many skeleton elements in this complex component
      
      // Check for the grid of food items (6 items)
      const gridItems = document.querySelectorAll('.grid > div');
      expect(gridItems.length).toBe(6);
    });
  });
});