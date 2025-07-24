import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CookingMethodList from '../CookingMethodList';
import '@testing-library/jest-dom';

describe('CookingMethodList', () => {
  const mockCookingMethods = [
    {
      id: 'method-1',
      name: '茹でる',
      description: '湯で茹でる調理法',
      steps: ['お湯を沸かす', '食材を入れる', '10分茹でる'],
      nutritionRetention: 80,
      difficulty: 'easy',
      cookingTime: 15,
    },
    {
      id: 'method-2',
      name: '蒸す',
      description: '蒸気で調理する方法',
      steps: ['蒸し器を準備', '食材を並べる', '15分蒸す'],
      nutritionRetention: 90,
      difficulty: 'medium',
      cookingTime: 20,
    },
    {
      id: 'method-3',
      name: '焼く',
      description: '直火で焼く調理法',
      steps: ['フライパンを熱する', '食材を入れる', '両面焼く'],
      nutritionRetention: 70,
      difficulty: 'hard',
      cookingTime: 10,
    },
  ];

  test('renders cooking methods sorted by nutrition retention by default', () => {
    render(<CookingMethodList cookingMethods={mockCookingMethods} />);
    
    const methodNames = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);
    expect(methodNames[0]).toBe('蒸す'); // 90% retention
    expect(methodNames[1]).toBe('茹でる'); // 80% retention
    expect(methodNames[2]).toBe('焼く'); // 70% retention
  });

  test('sorts cooking methods by difficulty when difficulty button is clicked', () => {
    render(<CookingMethodList cookingMethods={mockCookingMethods} />);
    
    // Click difficulty sort button
    fireEvent.click(screen.getByText('難易度'));
    
    const methodNames = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);
    expect(methodNames[0]).toBe('茹でる'); // easy
    expect(methodNames[1]).toBe('蒸す'); // medium
    expect(methodNames[2]).toBe('焼く'); // hard
  });

  test('sorts cooking methods by cooking time when time button is clicked', () => {
    render(<CookingMethodList cookingMethods={mockCookingMethods} />);
    
    // Click cooking time sort button
    fireEvent.click(screen.getByText('調理時間'));
    
    const methodNames = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);
    expect(methodNames[0]).toBe('焼く'); // 10 minutes
    expect(methodNames[1]).toBe('茹でる'); // 15 minutes
    expect(methodNames[2]).toBe('蒸す'); // 20 minutes
  });

  test('displays message when no cooking methods are available', () => {
    render(<CookingMethodList cookingMethods={[]} />);
    
    expect(screen.getByText('この食材に対する調理法情報はありません')).toBeInTheDocument();
  });

  test('displays all cooking method details correctly', () => {
    render(<CookingMethodList cookingMethods={[mockCookingMethods[0]]} />);
    
    // Check method name
    expect(screen.getByText('茹でる')).toBeInTheDocument();
    
    // Check description
    expect(screen.getByText('湯で茹でる調理法')).toBeInTheDocument();
    
    // Check difficulty badge
    expect(screen.getByText('簡単')).toBeInTheDocument();
    
    // Check cooking time
    expect(screen.getByText('15分')).toBeInTheDocument();
    
    // Check nutrition retention
    expect(screen.getByText('栄養保持率 80%')).toBeInTheDocument();
    
    // Check steps
    expect(screen.getByText('お湯を沸かす')).toBeInTheDocument();
    expect(screen.getByText('食材を入れる')).toBeInTheDocument();
    expect(screen.getByText('10分茹でる')).toBeInTheDocument();
  });
});