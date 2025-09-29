import React, { useRef, useState, useEffect } from 'react';
import VideoCard from './VideoCard';
import { Video } from '../services/api';

interface CarouselProps {
  videos: Video[];
  onVideoSelect: (video: Video) => void;
}

const Carousel: React.FC<CarouselProps> = ({ videos, onVideoSelect }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftBtn, setShowLeftBtn] = useState(false);
  const [showRightBtn, setShowRightBtn] = useState(true);

  useEffect(() => {
    checkScrollButtons();
  }, [videos]);

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

  return (
    <div className="carousel-container">
      {showLeftBtn && (
        <button className="carousel-btn left" onClick={() => scroll('left')}>‹</button>
      )}
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
      {showRightBtn && (
        <button className="carousel-btn right" onClick={() => scroll('right')}>›</button>
      )}
    </div>
  );
};

export default Carousel;
