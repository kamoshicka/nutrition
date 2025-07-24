import React from 'react';
import { render, screen } from '@testing-library/react';
import Skeleton from '../Skeleton';

describe('Skeleton', () => {
  it('renders with default props', () => {
    render(<Skeleton />);
    
    const skeleton = screen.getByRole('none', { hidden: true });
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('bg-gray-200');
    expect(skeleton).toHaveClass('animate-pulse');
    expect(skeleton).toHaveClass('rounded');
  });
  
  it('renders with custom width and height', () => {
    render(<Skeleton width={100} height={50} />);
    
    const skeleton = screen.getByRole('none', { hidden: true });
    expect(skeleton).toHaveStyle('width: 100px');
    expect(skeleton).toHaveStyle('height: 50px');
  });
  
  it('renders with string width and height', () => {
    render(<Skeleton width="100%" height="5rem" />);
    
    const skeleton = screen.getByRole('none', { hidden: true });
    expect(skeleton).toHaveStyle('width: 100%');
    expect(skeleton).toHaveStyle('height: 5rem');
  });
  
  it('renders with different variants', () => {
    const { rerender } = render(<Skeleton variant="text" />);
    expect(screen.getByRole('none', { hidden: true })).toHaveClass('rounded');
    
    rerender(<Skeleton variant="rectangular" />);
    expect(screen.getByRole('none', { hidden: true })).toHaveClass('rounded-none');
    
    rerender(<Skeleton variant="circular" />);
    expect(screen.getByRole('none', { hidden: true })).toHaveClass('rounded-full');
    
    rerender(<Skeleton variant="rounded" />);
    expect(screen.getByRole('none', { hidden: true })).toHaveClass('rounded-md');
  });
  
  it('renders with different animations', () => {
    const { rerender } = render(<Skeleton animation="pulse" />);
    expect(screen.getByRole('none', { hidden: true })).toHaveClass('animate-pulse');
    
    rerender(<Skeleton animation="wave" />);
    expect(screen.getByRole('none', { hidden: true })).toHaveClass('skeleton-wave');
    
    rerender(<Skeleton animation="none" />);
    const skeleton = screen.getByRole('none', { hidden: true });
    expect(skeleton).not.toHaveClass('animate-pulse');
    expect(skeleton).not.toHaveClass('skeleton-wave');
  });
  
  it('applies custom className', () => {
    render(<Skeleton className="custom-class" />);
    expect(screen.getByRole('none', { hidden: true })).toHaveClass('custom-class');
  });
});