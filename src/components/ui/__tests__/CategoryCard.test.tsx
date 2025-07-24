import React from 'react';
import { render, screen } from '@testing-library/react';
import CategoryCard from '../CategoryCard';
import { Category } from '@/types';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

describe('CategoryCard Component', () => {
  const mockCategory: Category = {
    id: 'digestive-health',
    name: '消化器系の健康',
    description: '胃腸の健康を促進し、消化器系の問題を改善するのに役立つ食材',
    foodIds: ['ginger', 'yogurt', 'banana']
  };

  test('renders category name and description', () => {
    render(<CategoryCard category={mockCategory} />);
    
    expect(screen.getByText('消化器系の健康')).toBeInTheDocument();
    expect(screen.getByText('胃腸の健康を促進し、消化器系の問題を改善するのに役立つ食材')).toBeInTheDocument();
  });

  test('displays the number of foods in the category', () => {
    render(<CategoryCard category={mockCategory} />);
    
    expect(screen.getByText('3種類の食材')).toBeInTheDocument();
  });

  test('links to the correct category detail page', () => {
    render(<CategoryCard category={mockCategory} />);
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/categories/digestive-health');
  });

  test('displays the "view related foods" text', () => {
    render(<CategoryCard category={mockCategory} />);
    
    expect(screen.getByText('関連食材を見る')).toBeInTheDocument();
  });

  test('applies custom className when provided', () => {
    render(<CategoryCard category={mockCategory} className="custom-class" />);
    
    const link = screen.getByRole('link');
    expect(link.className).toContain('custom-class');
  });
});