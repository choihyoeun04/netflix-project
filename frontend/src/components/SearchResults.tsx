import React from 'react';
import VideoCard from './VideoCard';
import { Video } from '../services/api';

interface SearchResultsProps {
  results: Video[];
  query: string;
  onVideoSelect: (video: Video) => void;
  onClearSearch: () => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ 
  results, 
  query, 
  onVideoSelect, 
  onClearSearch 
}) => {
  return (
    <div className="search-results">
      <div className="search-header">
        <h2>Search Results for "{query}"</h2>
        <button className="clear-search-btn" onClick={onClearSearch}>
          Back to Browse
        </button>
      </div>
      
      {results.length === 0 ? (
        <div className="no-results">
          <p>No videos found for "{query}"</p>
          <p>Try different keywords or browse by category</p>
        </div>
      ) : (
        <>
          <p className="results-count">{results.length} videos found</p>
          <div className="search-grid">
            {results.map((video) => (
              <VideoCard
                key={video._id}
                video={video}
                onClick={() => onVideoSelect(video)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SearchResults;
