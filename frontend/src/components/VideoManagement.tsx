import React, { useState, useEffect } from 'react';
import { videoAPI, Video } from '../services/api';

interface VideoManagementProps {
  onVideoSelect: (video: Video) => void;
}

const VideoManagement: React.FC<VideoManagementProps> = ({ onVideoSelect }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [uploadingThumbnail, setUploadingThumbnail] = useState<string | null>(null);
  const [deletingVideo, setDeletingVideo] = useState<string | null>(null);
  const [editingVideo, setEditingVideo] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', category: '', tags: '' });

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await videoAPI.getAll(1, 50);
      setVideos(response.data.videos);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVideo = (videoId: string) => {
    const newSelected = new Set(selectedVideos);
    if (newSelected.has(videoId)) {
      newSelected.delete(videoId);
    } else {
      newSelected.add(videoId);
    }
    setSelectedVideos(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedVideos.size === videos.length) {
      setSelectedVideos(new Set());
    } else {
      setSelectedVideos(new Set(videos.map(v => v._id)));
    }
  };

  const handleThumbnailUpload = async (videoId: string, file: File) => {
    setUploadingThumbnail(videoId);
    try {
      await videoAPI.updateThumbnail(videoId, file);
      fetchVideos();
    } catch (error) {
      console.error('Failed to update thumbnail:', error);
      alert('Failed to update thumbnail');
    } finally {
      setUploadingThumbnail(null);
    }
  };

  const handleDeleteVideo = async (videoId: string, videoTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${videoTitle}"? This action cannot be undone.`)) {
      return;
    }
    
    setDeletingVideo(videoId);
    try {
      await videoAPI.delete(videoId);
      const newSelected = new Set(selectedVideos);
      newSelected.delete(videoId);
      setSelectedVideos(newSelected);
      fetchVideos();
    } catch (error) {
      console.error('Failed to delete video:', error);
      alert('Failed to delete video');
    } finally {
      setDeletingVideo(null);
    }
  };

  const handleEditVideo = (video: Video) => {
    setEditingVideo(video._id);
    setEditForm({
      title: video.title,
      description: video.description,
      category: video.category,
      tags: video.tags.join(', ')
    });
  };

  const handleSaveEdit = async () => {
    if (!editingVideo) return;
    
    try {
      await videoAPI.update(editingVideo, editForm);
      setEditingVideo(null);
      fetchVideos();
    } catch (error) {
      console.error('Failed to update video:', error);
      alert('Failed to update video');
    }
  };

  const handleCancelEdit = () => {
    setEditingVideo(null);
    setEditForm({ title: '', description: '', category: '', tags: '' });
  };

  const triggerThumbnailUpload = (videoId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleThumbnailUpload(videoId, file);
      }
    };
    input.click();
  };

  if (loading) {
    return <div className="loading">Loading videos...</div>;
  }

  return (
    <div className="video-management">
      <div className="management-header">
        <h2>Video Management</h2>
        <div className="bulk-actions">
          <button 
            className="btn-secondary"
            onClick={handleSelectAll}
          >
            {selectedVideos.size === videos.length ? 'Deselect All' : 'Select All'}
          </button>
          {selectedVideos.size > 0 && (
            <span className="selected-count">
              {selectedVideos.size} selected
            </span>
          )}
        </div>
      </div>

      <div className="video-table">
        <div className="table-header">
          <div className="col-select">Select</div>
          <div className="col-thumbnail">Thumbnail</div>
          <div className="col-title">Title</div>
          <div className="col-category">Category</div>
          <div className="col-views">Views</div>
          <div className="col-date">Upload Date</div>
          <div className="col-actions">Actions</div>
        </div>

        {videos.map((video) => (
          <div key={video._id} className="table-row">
            <div className="col-select">
              <input
                type="checkbox"
                checked={selectedVideos.has(video._id)}
                onChange={() => handleSelectVideo(video._id)}
              />
            </div>
            <div className="col-thumbnail">
              <div className="thumbnail-preview">
                <img
                  src={videoAPI.getThumbnailUrl(video._id)}
                  alt={video.title}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    ((e.target as HTMLImageElement).nextElementSibling as HTMLElement)!.style.display = 'flex';
                  }}
                />
                <div className="thumbnail-placeholder" style={{ display: 'none' }}>
                  📹
                </div>
              </div>
            </div>
            <div className="col-title">
              {editingVideo === video._id ? (
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="edit-input"
                />
              ) : (
                <span className="video-title-text">{video.title}</span>
              )}
            </div>
            <div className="col-category">
              {editingVideo === video._id ? (
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="edit-select"
                >
                  <option value="Action">Action</option>
                  <option value="Comedy">Comedy</option>
                  <option value="Drama">Drama</option>
                  <option value="Horror">Horror</option>
                  <option value="Sci-Fi">Sci-Fi</option>
                  <option value="Documentary">Documentary</option>
                </select>
              ) : (
                video.category
              )}
            </div>
            <div className="col-views">{video.views}</div>
            <div className="col-date">
              {new Date(video.uploadDate).toLocaleDateString()}
            </div>
            <div className="col-actions">
              <button 
                className="btn-small btn-primary"
                onClick={() => onVideoSelect(video)}
              >
                Play
              </button>
              {editingVideo === video._id ? (
                <>
                  <button 
                    className="btn-small btn-success"
                    onClick={handleSaveEdit}
                  >
                    Save
                  </button>
                  <button 
                    className="btn-small btn-secondary"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button 
                  className="btn-small btn-secondary"
                  onClick={() => handleEditVideo(video)}
                >
                  Edit
                </button>
              )}
              <button 
                className="btn-small btn-secondary"
                onClick={() => triggerThumbnailUpload(video._id)}
                disabled={uploadingThumbnail === video._id}
              >
                {uploadingThumbnail === video._id ? 'Uploading...' : 'Edit Thumbnail'}
              </button>
              <button 
                className="btn-small btn-danger"
                onClick={() => handleDeleteVideo(video._id, video.title)}
                disabled={deletingVideo === video._id}
              >
                {deletingVideo === video._id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoManagement;
