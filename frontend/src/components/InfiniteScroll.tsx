import React, { useState, useEffect, useCallback } from 'react';
import VideoCard from './VideoCard';
import LoadingSkeleton from './LoadingSkeleton';
import { Video, videoAPI } from '../services/api';

interface InfiniteScrollProps {
  onVideoSelect: (video: Video) => void;
  category?: string;
}

const InfiniteScroll: React.FC<InfiniteScrollProps> = ({ onVideoSelect, category }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const loadVideos = useCallback(async (pageNum: number, reset = false) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response = await videoAPI.getAll(pageNum, 12, category);
      const newVideos = response.data.videos;
      
      if (reset) {
        setVideos(newVideos);
      } else {
        setVideos(prev => [...prev, ...newVideos]);
      }
      
      setHasMore(newVideos.length === 12);
    } catch (error) {
      console.error('Failed to load videos:', error);
    } finally {
      setLoading(false);
    }
  }, [category, loading]);

  useEffect(() => {
    setVideos([]);
    setPage(1);
    setHasMore(true);
    loadVideos(1, true);
  }, [category]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000
        && hasMore && !loading
      ) {
        const nextPage = page + 1;
        setPage(nextPage);
        loadVideos(nextPage);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, page, loadVideos]);

  return (
    <div className="infinite-scroll">
      <div className="video-grid">
        {videos.map((video) => (
          <VideoCard
            key={video._id}
            video={video}
            onClick={() => onVideoSelect(video)}
          />
        ))}
        {loading && <LoadingSkeleton type="video-card" count={6} />}
      </div>
      
      {!hasMore && videos.length > 0 && (
        <div className="end-message">
          <p>You've reached the end! 🎬</p>
        </div>
      )}
    </div>
  );
};

export default InfiniteScroll;
