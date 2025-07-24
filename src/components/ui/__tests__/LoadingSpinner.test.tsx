import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner Component', () => {
  test('renders with default props', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(screen.getByText('データを読み込み中...')).toBeInTheDocument();
  });

  test('renders with custom message', () => {
    render(<LoadingSpinner message="カテゴリを読み込み中..." />);
    
    expect(screen.getByText('カテゴリを読み込み中...')).toBeInTheDocument();
  });

  test('renders with different sizes', () => {
    const { rerender } = render(<LoadingSpinner size="small" />);
    
    let spinner = screen.getByRole('status');
    expect(spinner.className).toContain('w-4 h-4');
    
    rerender(<LoadingSpinner size="medium" />);
    spinner = screen.getByRole('status');
    expect(spinner.className).toContain('w-8 h-8');
    
    rerender(<LoadingSpinner size="large" />);
    spinner = screen.getByRole('status');
    expect(spinner.className).toContain('w-12 h-12');
  });

  test('applies custom className', () => {
    render(<LoadingSpinner className="my-custom-class" />);
    
    const container = screen.getByText('データを読み込み中...').parentElement;
    expect(container).toHaveClass('my-custom-class');
  });
});