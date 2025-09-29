import React, { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { Video, videoAPI } from '../services/api';

interface VideoPlayerProps {
  video: Video;
  onClose: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [player, setPlayer] = useState<any>(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const seekingRef = useRef(false);
  const videoUrl = videoAPI.getStreamUrl(video._id);

  useEffect(() => {
    // Request fullscreen when component mounts
    const requestFullscreen = async () => {
      if (containerRef.current) {
        try {
          if (containerRef.current.requestFullscreen) {
            await containerRef.current.requestFullscreen();
          }
        } catch (error) {
          console.log('Fullscreen request failed:', error);
        }
      }
    };

    // Delay fullscreen request to avoid user gesture error
    setTimeout(requestFullscreen, 100);

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        onClose();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [onClose]);

  useEffect(() => {
    // Listen for timeupdate, ended, and seeked events on video elements
    const handleTimeUpdate = (e: Event) => {
      const video = e.target as HTMLVideoElement;
      if (video && video.currentTime !== undefined && !seekingRef.current) {
        setCurrentTime(video.currentTime);
        if (video.duration && video.duration > 0 && !duration) {
          setDuration(video.duration);
        }
      }
    };

    const handleVideoEnded = () => {
      setVideoEnded(true);
      setPlaying(false);
    };

    const handleSeeked = (e: Event) => {
      const video = e.target as HTMLVideoElement;
      console.log('Seeked event - currentTime:', video.currentTime);
      setCurrentTime(video.currentTime);
      seekingRef.current = false;
    };

    // Add event listeners to all video elements
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('ended', handleVideoEnded);
      video.addEventListener('seeked', handleSeeked);
    });

    return () => {
      videos.forEach(video => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('ended', handleVideoEnded);
        video.removeEventListener('seeked', handleSeeked);
      });
    };
  }, [player, duration]);

  const handleReplay = () => {
    // Direct access to video element for replay
    const videos = document.querySelectorAll('video');
    if (videos.length > 0) {
      const video = videos[0] as HTMLVideoElement;
      video.currentTime = 0;
      video.play();
      setCurrentTime(0);
      setVideoEnded(false);
      setPlaying(true);
    }
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    // Don't toggle play if clicking on controls
    if ((e.target as HTMLElement).closest('.custom-controls')) {
      return;
    }
    
    togglePlay();
  };

  const handleMouseMove = () => {
    setShowControls(true);
    
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    
    hideTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const handleNextVideo = () => {
    onClose();
  };

  useEffect(() => {
    // Simple cleanup on unmount
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const seekPercent = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = seekPercent * duration;
    
    console.log('Seeking to:', newTime);
    
    if (duration > 0 && !isNaN(newTime)) {
      seekingRef.current = true;
      
      // Direct video element access
      const videos = document.querySelectorAll('video');
      if (videos.length > 0) {
        const video = videos[0] as HTMLVideoElement;
        video.currentTime = newTime;
        setCurrentTime(newTime);
        setVideoEnded(false);
      }
      
      setTimeout(() => {
        seekingRef.current = false;
      }, 500);
    }
  };

  const togglePlay = () => {
    const videos = document.querySelectorAll('video');
    if (videos.length > 0) {
      const video = videos[0] as HTMLVideoElement;
      if (playing) {
        video.pause();
      } else {
        video.play();
      }
      setPlaying(!playing);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="video-player-container" ref={containerRef} onMouseMove={handleMouseMove} onClick={handleVideoClick}>
      <ReactPlayer
        ref={(playerInstance) => {
          if (playerInstance && playerInstance !== player) {
            setPlayer(playerInstance);
            console.log('Player set with methods:', playerInstance, Object.keys(playerInstance));
          }
        }}
        src={videoUrl}
        controls={false}
        playing={playing}
        width="100vw"
        height="100vh"
        onReady={() => {
          console.log('onReady called, player methods:', player ? Object.keys(player) : 'no player');
        }}
      />
      
      {!playing && !videoEnded && (
        <div className="pause-overlay">
          <div className="pause-icon">▶</div>
          <div className="pause-text">Click anywhere to continue</div>
        </div>
      )}
      
      {videoEnded && (
        <div className="video-ended-overlay">
          <div className="ended-options">
            <h3>Video Ended</h3>
            <div className="ended-buttons">
              <button onClick={handleReplay} className="btn-primary">
                <div className="btn-icon">⟲</div>
                <span>Replay</span>
              </button>
              <button onClick={onClose} className="btn-secondary">
                <div className="btn-icon">⌂</div>
                <span>Home</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className={`custom-controls ${showControls ? 'visible' : 'hidden'}`}>
        <div className="progress-container" onClick={handleSeek}>
          <div className="progress-bar">
            <div 
              className="progress-filled" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        
        <div className="control-buttons">
          <button onClick={togglePlay}>
            {playing ? '⏸️' : '▶️'}
          </button>
          <span className="time-display">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
