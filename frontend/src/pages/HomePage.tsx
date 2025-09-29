import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import CategoryRow from '../components/CategoryRow';
import VideoPlayer from '../components/VideoPlayer';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { categoryAPI, videoAPI, Video } from '../services/api';

// Import apiCache directly
import { apiCache } from '../services/api';

const HomePage: React.FC = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const location = useLocation();

  // Default categories to always show
  const defaultCategories = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Documentary', 'Music'];

  useEffect(() => {
    // Force refresh when navigating to home page
    setRefreshKey(Date.now());
    fetchCategories();
  }, [location.pathname]);

  useEffect(() => {
    fetchCategories();
    
    // Listen for storage events to refresh when thumbnails are updated
    const handleStorageChange = () => {
      // Force refresh of categories when returning from dashboard
      setRefreshKey(Date.now());
      fetchCategories();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, []);

  const fetchCategories = async () => {
    try {
      // Clear cache to ensure fresh data
      apiCache.clear();
      
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

  if (loading) {
    return (
      <div className="home-page">
        <div className="categories-container">
          <LoadingSkeleton type="category" count={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      {selectedVideo && (
        <VideoPlayer
          video={selectedVideo}
          onClose={handleClosePlayer}
        />
      )}

      <div className="container">
        <div className="categories-container">
          {categories.map((category) => (
            <CategoryRow
              key={`${category}-${refreshKey}`}
              categoryName={category}
              onVideoSelect={handleVideoSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
