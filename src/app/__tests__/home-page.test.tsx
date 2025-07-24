import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Home from '../page';
import { Category } from '@/types';
import '@testing-library/jest-dom';

// Mock fetch
global.fetch = jest.fn();

// Mock categories data
const mockCategories: Category[] = [
  {
    id: 'cat1',
    name: '高血圧',
    description: '血圧を下げる効果のある食材',
    foodIds: ['food1', 'food2']
  },
  {
    id: 'cat2',
    name: '糖尿病',
    description: '血糖値を調整する効果のある食材',
    foodIds: ['food3', 'food4']
  },
  {
    id: 'cat3',
    name: '関節痛',
    description: '炎症を抑える効果のある食材',
    foodIds: ['food5', 'food6']
  }
];

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    // Mock fetch to return a pending promise
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    render(<Home />);
    
    expect(screen.getByText('データを読み込み中...')).toBeInTheDocument();
  });

  it('renders categories after successful fetch', async () => {
    // Mock successful fetch
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCategories
    });
    
    render(<Home />);
    
    // Wait for categories to be displayed
    await waitFor(() => {
      expect(screen.getByText('高血圧')).toBeInTheDocument();
      expect(screen.getByText('糖尿病')).toBeInTheDocument();
      expect(screen.getByText('関節痛')).toBeInTheDocument();
    });
    
    // Check descriptions
    expect(screen.getByText('血圧を下げる効果のある食材')).toBeInTheDocument();
    expect(screen.getByText('血糖値を調整する効果のある食材')).toBeInTheDocument();
    expect(screen.getByText('炎症を抑える効果のある食材')).toBeInTheDocument();
  });

  it('renders error message when fetch fails', async () => {
    // Mock failed fetch
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: 'API error' } })
    });
    
    render(<Home />);
    
    // Wait for error message to be displayed
    await waitFor(() => {
      expect(screen.getByText('カテゴリの読み込みに失敗しました')).toBeInTheDocument();
    });
    
    // Check retry button
    expect(screen.getByText('再試行')).toBeInTheDocument();
  });

  it('filters categories when searching', async () => {
    // Mock initial fetch
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCategories
    });
    
    // Mock search fetch
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [mockCategories[0]] // Return only the first category
    });
    
    render(<Home />);
    
    // Wait for categories to be displayed
    await waitFor(() => {
      expect(screen.getByText('高血圧')).toBeInTheDocument();
    });
    
    // Search for a category
    const searchInput = screen.getByPlaceholderText('カテゴリを検索...');
    fireEvent.change(searchInput, { target: { value: '高血圧' } });
    
    // Wait for filtered results
    await waitFor(() => {
      expect(screen.getByText('高血圧')).toBeInTheDocument();
      expect(screen.queryByText('糖尿病')).not.toBeInTheDocument();
      expect(screen.queryByText('関節痛')).not.toBeInTheDocument();
    });
  });

  it('shows no results message when search has no matches', async () => {
    // Mock initial fetch
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCategories
    });
    
    // Mock search fetch with empty results
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });
    
    render(<Home />);
    
    // Wait for categories to be displayed
    await waitFor(() => {
      expect(screen.getByText('高血圧')).toBeInTheDocument();
    });
    
    // Search for a non-existent category
    const searchInput = screen.getByPlaceholderText('カテゴリを検索...');
    fireEvent.change(searchInput, { target: { value: '存在しないカテゴリ' } });
    
    // Wait for no results message
    await waitFor(() => {
      expect(screen.getByText('検索条件に一致するカテゴリがありません')).toBeInTheDocument();
    });
  });
});