import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import FoodDetailPage from '../page';
import '@testing-library/jest-dom';

// Mock the useParams hook
jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'food-1' }),
}));

// Mock the CookingMethodList component
jest.mock('@/components/ui/CookingMethodList', () => {
  return function MockCookingMethodList({ cookingMethods }) {
    return (
      <div data-testid="cooking-method-list">
        {cookingMethods.map(method => (
          <div key={method.id}>
            <h3>{method.name}</h3>
            <p>{method.description}</p>
          </div>
        ))}
      </div>
    );
  };
});

// Mock fetch function
global.fetch = jest.fn();

describe('FoodDetailPage', () => {
  const mockFood = {
    id: 'food-1',
    name: 'テスト食材',
    description: 'テスト用の食材説明',
    nutritionalInfo: {
      calories: 100,
      protein: 5,
      carbohydrates: 20,
      fat: 2,
      vitamins: ['ビタミンA', 'ビタミンC'],
      minerals: ['カルシウム', '鉄分'],
    },
    healthBenefits: [
      {
        condition: '免疫力向上',
        effect: '免疫システムを強化します',
        scientificBasis: '研究によると...',
        effectiveness: 'high',
      },
    ],
    precautions: ['アレルギーに注意'],
    cookingMethodIds: ['method-1', 'method-2'],
  };

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
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    // Mock fetch to return a pending promise
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    render(<FoodDetailPage />);
    
    expect(screen.getByText('食材情報を読み込み中...')).toBeInTheDocument();
  });

  test('renders food details when data is loaded successfully', async () => {
    // Mock successful fetch
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ food: mockFood, cookingMethods: mockCookingMethods }),
    });
    
    render(<FoodDetailPage />);
    
    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByText('テスト食材')).toBeInTheDocument();
    });
    
    // Check if nutritional info is displayed
    expect(screen.getByText('100 kcal')).toBeInTheDocument();
    expect(screen.getByText('5g')).toBeInTheDocument();
    
    // Check if health benefits are displayed
    expect(screen.getByText('免疫力向上')).toBeInTheDocument();
    expect(screen.getByText('免疫システムを強化します')).toBeInTheDocument();
    
    // Check if precautions are displayed
    expect(screen.getByText('アレルギーに注意')).toBeInTheDocument();
    
    // Check if cooking methods section is displayed
    expect(screen.getByText('推奨調理法')).toBeInTheDocument();
    expect(screen.getByText('茹でる')).toBeInTheDocument();
    expect(screen.getByText('蒸す')).toBeInTheDocument();
    expect(screen.getByText('並び替え:')).toBeInTheDocument();
  });

  test('renders error message when fetch fails', async () => {
    // Mock failed fetch
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: 'データ取得エラー' } }),
    });
    
    render(<FoodDetailPage />);
    
    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText('食材情報の読み込みに失敗しました')).toBeInTheDocument();
    });
  });
});