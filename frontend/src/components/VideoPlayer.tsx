import React, { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { Video, videoAPI } from '../services/api';

interface VideoPlayerProps {
  video: Video;
  onClose: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoUrl = videoAPI.getStreamUrl(video._id);

  useEffect(() => {
    // Request fullscreen when component mounts
    const requestFullscreen = async () => {
      if (containerRef.current) {
        try {
          if (containerRef.current.requestFullscreen) {
            await containerRef.current.requestFullscreen();
          } else if ((containerRef.current as any).webkitRequestFullscreen) {
            await (containerRef.current as any).webkitRequestFullscreen();
          } else if ((containerRef.current as any).msRequestFullscreen) {
            await (containerRef.current as any).msRequestFullscreen();
          }
        } catch (error) {
          console.log('Fullscreen request failed:', error);
        }
      }
    };

    requestFullscreen();

    // Handle fullscreen exit
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && 
          !(document as any).webkitFullscreenElement && 
          !(document as any).msFullscreenElement) {
        onClose();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [onClose]);

  const handleMouseMove = () => {
    setShowControls(true);
    
    // Clear existing timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    
    // Hide controls after 3 seconds of no mouse movement
    hideTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const handleClose = async () => {
    // Exit fullscreen before closing
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if ((document as any).webkitFullscreenElement) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).msFullscreenElement) {
        await (document as any).msExitFullscreen();
      }
    } catch (error) {
      console.log('Exit fullscreen failed:', error);
    }
    onClose();
  };

  return (
    <div 
      className="video-player-container fullscreen-player" 
      ref={containerRef}
      onMouseMove={handleMouseMove}
    >
      <button 
        className={`close-btn ${showControls ? 'visible' : 'hidden'}`} 
        onClick={handleClose}
      >
        ×
      </button>
      <ReactPlayer
        src={videoUrl}
        controls={true}
        autoPlay={true}
        width="100vw"
        height="100vh"
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0
        }}
      />
    </div>
  );
};

export default VideoPlayer;
