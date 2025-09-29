import React, { useState, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { searchAPI } from '../services/api';

interface SearchBarProps {
  onSearchResults: (results: any[], query: string) => void;
  onClearSearch: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearchResults, onClearSearch }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      handleSearch();
    } else {
      onClearSearch();
    }
  }, [debouncedQuery]);

  const handleSearch = async () => {
    if (!debouncedQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await searchAPI.search(debouncedQuery);
      onSearchResults(response.data.results, debouncedQuery);
    } catch (error) {
      console.error('Search failed:', error);
      onSearchResults([], debouncedQuery);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleClear = () => {
    setQuery('');
    onClearSearch();
  };

  return (
    <div className="search-container">
      <div className="search-input-wrapper">
        <input
          type="text"
          className="search-bar"
          placeholder="Search videos..."
          value={query}
          onChange={handleInputChange}
        />
        {query && (
          <button className="clear-input-btn" onClick={handleClear}>
            ×
          </button>
        )}
        {isSearching && <div className="search-spinner">🔍</div>}
      </div>
    </div>
  );
};

export default SearchBar;
