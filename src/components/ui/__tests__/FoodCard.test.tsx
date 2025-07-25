import React from 'react';
import { render, screen } from '@testing-library/react';
import FoodCard from '../FoodCard';
import { Food } from '@/types';

// Mock Next.js Link component
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = 'MockLink';
  return MockLink;
});

describe('FoodCard Component', () => {
  const mockFood: Food = {
    id: 'ginger',
    name: '生姜',
    description: '辛味と香りが特徴的な根菜で、消化促進や抗炎症作用がある',
    nutritionalInfo: {
      calories: 80,
      protein: 1.8,
      carbohydrates: 17.8,
      fat: 0.8,
      vitamins: ['ビタミンC', 'ビタミンB6'],
      minerals: ['マグネシウム', 'カリウム', 'マンガン']
    },
    healthBenefits: [
      {
        condition: '消化器系の健康',
        effect: '消化を促進し、吐き気や胃もたれを軽減する',
        scientificBasis: 'ジンゲロールという成分が胃腸の蠕動運動を促進し、消化酵素の分泌を高めることが確認されている',
        effectiveness: 'high'
      }
    ],
    precautions: ['胆石がある場合は医師に相談する', '血液凝固阻害薬との併用注意'],
    cookingMethodIds: ['tea', 'stir-fry', 'pickled']
  };

  test('renders food name and description', () => {
    render(<FoodCard food={mockFood} />);
    
    expect(screen.getByText('生姜')).toBeInTheDocument();
    expect(screen.getByText('辛味と香りが特徴的な根菜で、消化促進や抗炎症作用がある')).toBeInTheDocument();
  });

  test('displays the primary health benefit', () => {
    render(<FoodCard food={mockFood} />);
    
    expect(screen.getByText('消化器系の健康に効果的')).toBeInTheDocument();
    expect(screen.getByText('消化を促進し、吐き気や胃もたれを軽減する')).toBeInTheDocument();
  });

  test('displays nutritional information', () => {
    render(<FoodCard food={mockFood} />);
    
    expect(screen.getByText('カロリー: 80kcal')).toBeInTheDocument();
    expect(screen.getByText('タンパク質: 1.8g')).toBeInTheDocument();
    expect(screen.getByText('炭水化物: 17.8g')).toBeInTheDocument();
    expect(screen.getByText('脂質: 0.8g')).toBeInTheDocument();
  });

  test('links to the correct food detail page', () => {
    render(<FoodCard food={mockFood} />);
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/foods/ginger');
  });

  test('displays precaution indicator when precautions exist', () => {
    render(<FoodCard food={mockFood} />);
    
    expect(screen.getByText('注意事項あり')).toBeInTheDocument();
  });

  test('does not display precaution indicator when no precautions exist', () => {
    const foodWithoutPrecautions = {
      ...mockFood,
      precautions: []
    };
    
    render(<FoodCard food={foodWithoutPrecautions} />);
    
    expect(screen.queryByText('注意事項あり')).not.toBeInTheDocument();
  });

  test('applies custom className when provided', () => {
    render(<FoodCard food={mockFood} className="custom-class" />);
    
    const link = screen.getByRole('link');
    expect(link.className).toContain('custom-class');
  });
});