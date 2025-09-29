import React, { useState, useEffect } from 'react';
import CategoryRow from '../components/CategoryRow';
import VideoPlayer from '../components/VideoPlayer';
import SearchBar from '../components/SearchBar';
import SearchResults from '../components/SearchResults';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { categoryAPI, videoAPI, Video } from '../services/api';

const HomePage: React.FC = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Default categories to always show
  const defaultCategories = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Documentary'];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      const existingCategories = response.data.categories.map((cat: any) => cat.name);
      
      // Combine existing categories with default ones, remove duplicates
      const combinedCategories = [...existingCategories, ...defaultCategories];
      const allCategories = Array.from(new Set(combinedCategories));
      setCategories(allCategories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      // Fallback to default categories if API fails
      setCategories(defaultCategories);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video);
    videoAPI.incrementView(video._id);
  };

  const handleClosePlayer = () => {
    setSelectedVideo(null);
  };

  const handleSearchResults = (results: Video[], query: string) => {
    setSearchResults(results);
    setSearchQuery(query);
    setIsSearchMode(true);
  };

  const handleClearSearch = () => {
    setSearchResults([]);
    setSearchQuery('');
    setIsSearchMode(false);
  };

  if (loading) {
    return (
      <div className="home-page">
        <div className="hero-section">
          <SearchBar 
            onSearchResults={handleSearchResults}
            onClearSearch={handleClearSearch}
          />
          <h1>Browse Videos</h1>
        </div>
        <div className="categories-container">
          <LoadingSkeleton type="category" count={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="hero-section">
        <SearchBar 
          onSearchResults={handleSearchResults}
          onClearSearch={handleClearSearch}
        />
        {!isSearchMode && <h1>Browse Videos</h1>}
      </div>
      
      {isSearchMode ? (
        <div className="container">
          <SearchResults
            results={searchResults}
            query={searchQuery}
            onVideoSelect={handleVideoSelect}
            onClearSearch={handleClearSearch}
          />
        </div>
      ) : (
        <div className="categories-container">
          {categories.map((category) => (
            <CategoryRow
              key={category}
              categoryName={category}
              onVideoSelect={handleVideoSelect}
            />
          ))}
        </div>
      )}

      {selectedVideo && (
        <VideoPlayer
          video={selectedVideo}
          onClose={handleClosePlayer}
        />
      )}
    </div>
  );
};

export default HomePage;
