import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SearchBar from '../SearchBar';

// Mock the API
jest.mock('../../services/api', () => ({
  searchAPI: {
    search: jest.fn().mockResolvedValue({
      data: { results: [] }
    })
  }
}));

describe('SearchBar', () => {
  test('renders search input', () => {
    const mockOnSearchResults = jest.fn();
    const mockOnClearSearch = jest.fn();
    
    render(
      <SearchBar 
        onSearchResults={mockOnSearchResults} 
        onClearSearch={mockOnClearSearch} 
      />
    );
    
    expect(screen.getByPlaceholderText('Search videos...')).toBeInTheDocument();
  });

  test('shows clear button when typing', () => {
    const mockOnSearchResults = jest.fn();
    const mockOnClearSearch = jest.fn();
    
    render(
      <SearchBar 
        onSearchResults={mockOnSearchResults} 
        onClearSearch={mockOnClearSearch} 
      />
    );
    
    const input = screen.getByPlaceholderText('Search videos...');
    fireEvent.change(input, { target: { value: 'test' } });
    
    expect(screen.getByText('×')).toBeInTheDocument();
  });
});
