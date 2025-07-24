import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import SearchBar from '../SearchBar';

// Mock timers for debounce testing
jest.useFakeTimers();

describe('SearchBar Component', () => {
  test('renders with default placeholder', () => {
    render(<SearchBar onChange={() => {}} />);
    expect(screen.getByPlaceholderText('検索...')).toBeInTheDocument();
  });

  test('renders with custom placeholder', () => {
    render(<SearchBar onChange={() => {}} placeholder="カテゴリを検索" />);
    expect(screen.getByPlaceholderText('カテゴリを検索')).toBeInTheDocument();
  });

  test('displays the provided value', () => {
    render(<SearchBar onChange={() => {}} value="野菜" />);
    expect(screen.getByDisplayValue('野菜')).toBeInTheDocument();
  });

  test('calls onChange after debounce time', () => {
    const handleChange = jest.fn();
    render(<SearchBar onChange={handleChange} debounceTime={300} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '果物' } });
    
    // onChange should not be called immediately
    expect(handleChange).not.toHaveBeenCalled();
    
    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    // Now onChange should be called
    expect(handleChange).toHaveBeenCalledWith('果物');
  });

  test('calls onSearch when form is submitted', () => {
    const handleSearch = jest.fn();
    render(<SearchBar onChange={() => {}} onSearch={handleSearch} value="野菜" />);
    
    const form = screen.getByRole('textbox').closest('form');
    fireEvent.submit(form!);
    
    expect(handleSearch).toHaveBeenCalledWith('野菜');
  });

  test('clears previous debounce timer on new input', () => {
    const handleChange = jest.fn();
    render(<SearchBar onChange={handleChange} debounceTime={300} />);
    
    const input = screen.getByRole('textbox');
    
    // Type first input
    fireEvent.change(input, { target: { value: '果' } });
    
    // Type second input before debounce time completes
    act(() => {
      jest.advanceTimersByTime(100);
    });
    fireEvent.change(input, { target: { value: '果物' } });
    
    // Fast-forward time to complete debounce
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    // onChange should only be called once with the final value
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith('果物');
  });
});