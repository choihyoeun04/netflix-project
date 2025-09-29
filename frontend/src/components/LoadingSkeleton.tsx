import React from 'react';

interface LoadingSkeletonProps {
  type: 'video-card' | 'carousel' | 'category';
  count?: number;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type, count = 1 }) => {
  if (type === 'video-card') {
    return (
      <>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="skeleton-card">
            <div className="skeleton-thumbnail"></div>
            <div className="skeleton-info">
              <div className="skeleton-title"></div>
              <div className="skeleton-meta"></div>
            </div>
          </div>
        ))}
      </>
    );
  }

  if (type === 'carousel') {
    return (
      <div className="skeleton-carousel">
        <div className="skeleton-carousel-title"></div>
        <div className="skeleton-carousel-items">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="skeleton-carousel-item">
              <div className="skeleton-thumbnail"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'category') {
    return (
      <div className="skeleton-categories">
        {Array.from({ length: count }).map((_, index) => (
          <LoadingSkeleton key={index} type="carousel" />
        ))}
      </div>
    );
  }

  return null;
};

export default LoadingSkeleton;
