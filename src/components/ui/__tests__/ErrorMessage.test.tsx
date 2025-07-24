import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorMessage from '../ErrorMessage';

describe('ErrorMessage Component', () => {
  test('renders with default props', () => {
    render(<ErrorMessage />);
    
    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('renders with custom message', () => {
    render(<ErrorMessage message="データの読み込みに失敗しました" />);
    
    expect(screen.getByText('データの読み込みに失敗しました')).toBeInTheDocument();
  });

  test('renders with details', () => {
    render(<ErrorMessage details="ネットワーク接続を確認してください" />);
    
    expect(screen.getByText('ネットワーク接続を確認してください')).toBeInTheDocument();
  });

  test('renders retry button when onRetry is provided', () => {
    const handleRetry = jest.fn();
    render(<ErrorMessage onRetry={handleRetry} />);
    
    const retryButton = screen.getByRole('button', { name: '再試行' });
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  test('applies custom className', () => {
    render(<ErrorMessage className="my-custom-class" />);
    
    const container = screen.getByRole('alert');
    expect(container).toHaveClass('my-custom-class');
  });
});