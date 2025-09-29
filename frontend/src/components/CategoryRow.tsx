import React, { useState, useEffect, useRef } from 'react';
import VideoCard from './VideoCard';
import LoadingSkeleton from './LoadingSkeleton';
import { categoryAPI, Video } from '../services/api';

interface CategoryRowProps {
  categoryName: string;
  onVideoSelect: (video: Video) => void;
}

const CategoryRow: React.FC<CategoryRowProps> = ({ categoryName, onVideoSelect }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showLeftBtn, setShowLeftBtn] = useState(false);
  const [showRightBtn, setShowRightBtn] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCategoryVideos();
  }, [categoryName, refreshKey]);

  useEffect(() => {
    // Listen for thumbnail updates
    const handleThumbnailUpdate = () => {
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('storage', handleThumbnailUpdate);
    return () => window.removeEventListener('storage', handleThumbnailUpdate);
  }, []);

  useEffect(() => {
    checkScrollButtons();
  }, [videos]);

  const fetchCategoryVideos = async () => {
    try {
      const response = await categoryAPI.getVideos(categoryName);
      setVideos(response.data.videos);
    } catch (error) {
      console.error(`Failed to fetch ${categoryName} videos:`, error);
      setVideos([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftBtn(scrollLeft > 0);
      setShowRightBtn(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      
      setTimeout(checkScrollButtons, 300);
    }
  };

  if (loading) {
    return <LoadingSkeleton type="carousel" />;
  }

  return (
    <div className="category-row fade-in">
      <div className="category-header">
        <h3 className="category-title">{categoryName}</h3>
        <div className="category-nav-buttons">
          {showLeftBtn && (
            <button className="category-nav-btn" onClick={() => scroll('left')}>‹</button>
          )}
          {showRightBtn && (
            <button className="category-nav-btn" onClick={() => scroll('right')}>›</button>
          )}
        </div>
      </div>
      
      {videos.length === 0 ? (
        <div className="empty-category">
          <div className="empty-message">
            <p>No videos found in {categoryName}.</p>
            <p>Want to upload something? <a href="/dashboard">Go to Dashboard</a></p>
          </div>
        </div>
      ) : (
        <div 
          className="carousel" 
          ref={scrollRef}
          onScroll={checkScrollButtons}
        >
          {videos.map((video) => (
            <div key={video._id} className="carousel-item">
              <VideoCard video={video} onClick={() => onVideoSelect(video)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryRow;
