import React, { useState } from 'react';
import UploadForm from '../components/UploadForm';
import VideoManagement from '../components/VideoManagement';
import VideoPlayer from '../components/VideoPlayer';
import { Video } from '../services/api';

const UploadPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'manage'>('upload');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey(prev => prev + 1);
    if (activeTab === 'upload') {
      setActiveTab('manage');
    }
  };

  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video);
  };

  const handleClosePlayer = () => {
    setSelectedVideo(null);
  };

  return (
    <div className="upload-page">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            Upload Video
          </button>
          <button 
            className={`tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
            onClick={() => setActiveTab('manage')}
          >
            Manage Videos
          </button>
        </div>
      </div>

      <div className="admin-content">
        {activeTab === 'upload' ? (
          <UploadForm onUploadSuccess={handleUploadSuccess} />
        ) : (
          <VideoManagement 
            key={refreshKey}
            onVideoSelect={handleVideoSelect} 
          />
        )}
      </div>

      {selectedVideo && (
        <VideoPlayer
          video={selectedVideo}
          onClose={handleClosePlayer}
        />
      )}
    </div>
  );
};

export default UploadPage;
