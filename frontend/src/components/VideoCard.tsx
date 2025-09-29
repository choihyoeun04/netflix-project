import React, { useState } from 'react';
import { Video, videoAPI } from '../services/api';

interface VideoCardProps {
  video: Video;
  onClick: () => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onClick }) => {
  const [imageError, setImageError] = useState(false);
  const thumbnailUrl = videoAPI.getThumbnailUrl(video._id);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="video-card" onClick={onClick}>
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
