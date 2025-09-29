import React, { useState, useEffect } from 'react';
import Carousel from './Carousel';
import LoadingSkeleton from './LoadingSkeleton';
import { categoryAPI, Video } from '../services/api';

interface CategoryRowProps {
  categoryName: string;
  onVideoSelect: (video: Video) => void;
}

const CategoryRow: React.FC<CategoryRowProps> = ({ categoryName, onVideoSelect }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategoryVideos();
  }, [categoryName]);

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

  if (loading) {
    return <LoadingSkeleton type="carousel" />;
  }

  return (
    <div className="category-row fade-in">
      <h3 className="category-title">{categoryName}</h3>
      {videos.length === 0 ? (
        <div className="empty-category">
          <div className="empty-message">
            <p>No videos found in {categoryName}.</p>
            <p>Want to upload something? <a href="/dashboard">Go to Dashboard</a></p>
          </div>
        </div>
      ) : (
        <Carousel videos={videos} onVideoSelect={onVideoSelect} />
      )}
    </div>
  );
};

export default CategoryRow;
