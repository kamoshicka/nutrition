import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CategoryPage from '../page';
import { useParams } from 'next/navigation';
import '@testing-library/jest-dom';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...rest }: any) => {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  };
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// Mock fetch API
global.fetch = jest.fn();

describe('CategoryPage', () => {
  const mockCategory = {
    id: 'diabetes',
    name: '糖尿病',
    description: '血糖値の管理に効果的な食材を含むカテゴリ',
    foodIds: ['bitter-melon', 'cinnamon']
  };

  const mockFoods = [
    {
      id: 'bitter-melon',
      name: 'ゴーヤ（苦瓜）',
      description: '沖縄の代表的な野菜で、血糖値の調整に効果があるとされる',
      nutritionalInfo: {
        calories: 17,
        protein: 1.0,
        carbohydrates: 3.9,
        fat: 0.1,
        vitamins: ['ビタミンC', 'ビタミンK'],
        minerals: ['カリウム', 'マグネシウム']
      },
      healthBenefits: [
        {
          condition: '糖尿病',
          effect: '血糖値の上昇を抑制する',
          scientificBasis: '研究で確認されている',
          effectiveness: 'high'
        }
      ],
      precautions: ['妊娠中の摂取は控える'],
      cookingMethodIds: ['stir-fry']
    },
    {
      id: 'cinnamon',
      name: 'シナモン',
      description: '血糖値の調整に役立つスパイス',
      nutritionalInfo: {
        calories: 247,
        protein: 4.0,
        carbohydrates: 80.6,
        fat: 1.2,
        vitamins: ['ビタミンA', 'ビタミンK'],
        minerals: ['カルシウム', '鉄分']
      },
      healthBenefits: [
        {
          condition: '糖尿病',
          effect: 'インスリン感受性を高める',
          scientificBasis: '複数の研究で効果が示されている',
          effectiveness: 'medium'
        }
      ],
      precautions: [],
      cookingMethodIds: ['infusion']
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useParams
    (useParams as jest.Mock).mockReturnValue({ id: 'diabetes' });
    
    // Mock successful API responses
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/categories/diabetes')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCategory)
        });
      } else if (url.includes('/api/categories/diabetes/foods')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFoods)
        });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  test('renders loading state initially', () => {
    render(<CategoryPage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('renders category and foods after loading', async () => {
    render(<CategoryPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
    
    // Check category information is displayed
    expect(screen.getByRole('heading', { level: 1, name: '糖尿病' })).toBeInTheDocument();
    expect(screen.getByText('血糖値の管理に効果的な食材を含むカテゴリ')).toBeInTheDocument();
    
    // Check food cards are displayed
    expect(screen.getByText('ゴーヤ（苦瓜）')).toBeInTheDocument();
    expect(screen.getByText('沖縄の代表的な野菜で、血糖値の調整に効果があるとされる')).toBeInTheDocument();
    expect(screen.getByText('シナモン')).toBeInTheDocument();
    expect(screen.getByText('血糖値の調整に役立つスパイス')).toBeInTheDocument();
    
    // Check navigation elements
    expect(screen.getByText('カテゴリ一覧に戻る')).toBeInTheDocument();
    expect(screen.getAllByText('詳細を見る').length).toBe(2);
    
    // Check food count is displayed
    expect(screen.getByText('2件の食材が見つかりました')).toBeInTheDocument();
  });

  test('filters foods based on search term', async () => {
    render(<CategoryPage />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
    
    // Enter search term
    const searchInput = screen.getByPlaceholderText('食材を検索...');
    fireEvent.change(searchInput, { target: { value: 'ゴーヤ' } });
    
    // Check food is still displayed
    expect(screen.getByText('ゴーヤ（苦瓜）')).toBeInTheDocument();
    expect(screen.queryByText('シナモン')).not.toBeInTheDocument();
    expect(screen.getByText('1件の食材が見つかりました (検索: "ゴーヤ")')).toBeInTheDocument();
    
    // Enter search term that doesn't match
    fireEvent.change(searchInput, { target: { value: '存在しない食材' } });
    
    // Check no foods message is displayed
    expect(screen.getByText('検索条件に一致する食材がありません')).toBeInTheDocument();
  });

  test('handles API error', async () => {
    // Mock API error
    (global.fetch as jest.Mock).mockImplementation(() => {
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: { message: 'API error' } })
      });
    });
    
    render(<CategoryPage />);
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('データの読み込みに失敗しました')).toBeInTheDocument();
    });
    
    // Check retry button
    const retryButton = screen.getByText('再試行');
    expect(retryButton).toBeInTheDocument();
    
    // Test retry functionality
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/categories/diabetes')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCategory)
        });
      } else if (url.includes('/api/categories/diabetes/foods')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFoods)
        });
      }
      return Promise.reject(new Error('Not found'));
    });
    
    fireEvent.click(retryButton);
    
    await waitFor(() => {
      expect(screen.getByText('糖尿病')).toBeInTheDocument();
    });
  });
  
  test('renders not found message when category does not exist', async () => {
    // Mock category not found
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/categories/diabetes')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(null)
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });
    });
    
    render(<CategoryPage />);
    
    await waitFor(() => {
      expect(screen.getByText('カテゴリが見つかりません')).toBeInTheDocument();
    });
  });
});