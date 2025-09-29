import React, { useState } from 'react';
import { Video, videoAPI } from '../services/api';

interface VideoCardProps {
  video: Video;
  onClick: () => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onClick }) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const thumbnailUrl = `${videoAPI.getThumbnailUrl(video._id)}?t=${(video as any).thumbnailUpdated || video.uploadDate}`;

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div 
      className="video-card" 
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="video-thumbnail">
        {!imageError ? (
          <img
            src={thumbnailUrl}
            alt={video.title}
            onError={handleImageError}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <div className="placeholder-thumbnail">
            <span>📹</span>
            <div className="placeholder-text">{video.title}</div>
          </div>
        )}
        
        {isHovered && (
          <div className="video-hover-overlay">
            <div className="hover-content">
              <h4 className="hover-title">{video.title}</h4>
              <div className="hover-meta">
                <span className="hover-category">{video.category}</span>
                <span className="hover-views">{video.views} views</span>
              </div>
              <p className="hover-description">
                {video.description.length > 100 
                  ? `${video.description.substring(0, 100)}...` 
                  : video.description}
              </p>
              <div className="hover-footer">
                <div className="hover-date">
                  {new Date(video.uploadDate).toLocaleDateString()}
                </div>
                {video.tags && video.tags.length > 0 && (
                  <div className="hover-tags">
                    {video.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="hover-tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="video-info">
        <div className="video-title">{video.title}</div>
        <div className="video-meta">
          <span>{video.category}</span> • <span>{video.views} views</span>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
