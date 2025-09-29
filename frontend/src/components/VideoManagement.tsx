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
  const [editErrors, setEditErrors] = useState<{[key: string]: string}>({});
  const [sortBy, setSortBy] = useState<'title' | 'views' | 'uploadDate' | 'category'>('uploadDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Validation limits
  const MAX_TITLE_LENGTH = 40;
  const MAX_DESCRIPTION_LENGTH = 200;

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
      // Force thumbnail refresh by updating the video's timestamp
      setVideos(prevVideos => 
        prevVideos.map(video => 
          video._id === videoId 
            ? { ...video, thumbnailUpdated: Date.now() }
            : video
        )
      );
      // Trigger home page refresh by setting localStorage flag
      localStorage.setItem('thumbnailUpdated', Date.now().toString());
      window.dispatchEvent(new Event('storage'));
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

  const handleEditInputChange = (field: string, value: string) => {
    // Clear previous error for this field
    setEditErrors(prev => ({ ...prev, [field]: '' }));
    
    // Validate length limits
    if (field === 'title' && value.length > MAX_TITLE_LENGTH) {
      setEditErrors(prev => ({ ...prev, title: `Title must be ${MAX_TITLE_LENGTH} characters or less` }));
      return;
    }
    
    if (field === 'description' && value.length > MAX_DESCRIPTION_LENGTH) {
      setEditErrors(prev => ({ ...prev, description: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less` }));
      return;
    }
    
    setEditForm({ ...editForm, [field]: value });
  };

  const handleSaveEdit = async () => {
    if (!editingVideo) return;
    
    // Validate form before saving
    const newErrors: {[key: string]: string} = {};
    
    if (!editForm.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (editForm.title.length > MAX_TITLE_LENGTH) {
      newErrors.title = `Title must be ${MAX_TITLE_LENGTH} characters or less`;
    }
    
    if (!editForm.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (editForm.description.length > MAX_DESCRIPTION_LENGTH) {
      newErrors.description = `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`;
    }
    
    if (Object.keys(newErrors).length > 0) {
      setEditErrors(newErrors);
      return;
    }
    
    try {
      await videoAPI.update(editingVideo, editForm);
      setEditingVideo(null);
      setEditErrors({});
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

  const sortedVideos = [...videos].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'views':
        aValue = a.views;
        bValue = b.views;
        break;
      case 'uploadDate':
        aValue = new Date(a.uploadDate);
        bValue = new Date(b.uploadDate);
        break;
      case 'category':
        aValue = a.category.toLowerCase();
        bValue = b.category.toLowerCase();
        break;
      default:
        return 0;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });

  if (loading) {
    return <div className="loading">Loading videos...</div>;
  }

  return (
    <div className="video-management">
      <div className="management-header">
        <h2>Video Management</h2>
        <div className="bulk-actions">
          <div className="sort-controls">
            <label>Sort by:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className="sort-select"
            >
              <option value="uploadDate">Upload Date</option>
              <option value="title">Title</option>
              <option value="views">Views</option>
              <option value="category">Category</option>
            </select>
            <button 
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="sort-order-btn"
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
          
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

        {sortedVideos.map((video) => (
          <React.Fragment key={video._id}>
            <div className="table-row">
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
                    src={`${videoAPI.getThumbnailUrl(video._id)}?t=${(video as any).thumbnailUpdated || video.uploadDate}`}
                    alt={video.title}
                    onError={(e) => {
                      console.log('Thumbnail load error, but may be SVG default');
                    }}
                  />
                </div>
              </div>
              <div className="col-title">
                <span className="video-title-text">{video.title}</span>
              </div>
              <div className="col-category">
                {video.category}
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
                <button 
                  className="btn-small btn-secondary"
                  onClick={() => handleEditVideo(video)}
                >
                  Edit
                </button>
                <button 
                  className="btn-small btn-secondary"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        handleThumbnailUpload(video._id, file);
                      }
                    };
                    input.click();
                  }}
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
            
            {editingVideo === video._id && (
              <div className="edit-form-overlay">
                <div className="edit-form-container">
                  <div className="edit-form-header">
                    <h3>Edit Video</h3>
                    <div className="edit-form-actions">
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
                    </div>
                  </div>
                  
                  <div className="edit-form-content">
                    <div className="form-group">
                      <label>Title:</label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => handleEditInputChange('title', e.target.value)}
                        className="edit-input"
                        maxLength={MAX_TITLE_LENGTH}
                      />
                      <div className="input-info">
                        <span className={`char-count ${editForm.title.length > MAX_TITLE_LENGTH ? 'error' : ''}`}>
                          {editForm.title.length}/{MAX_TITLE_LENGTH}
                        </span>
                      </div>
                      {editErrors.title && <div className="error-message">{editErrors.title}</div>}
                    </div>

                    <div className="form-group">
                      <label>Category:</label>
                      <select
                        value={editForm.category}
                        onChange={(e) => handleEditInputChange('category', e.target.value)}
                        className="edit-select"
                      >
                        <option value="Action">Action</option>
                        <option value="Comedy">Comedy</option>
                        <option value="Drama">Drama</option>
                        <option value="Horror">Horror</option>
                        <option value="Sci-Fi">Sci-Fi</option>
                        <option value="Documentary">Documentary</option>
                        <option value="Music">Music</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Description:</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => handleEditInputChange('description', e.target.value)}
                        className="edit-textarea"
                        rows={3}
                        maxLength={MAX_DESCRIPTION_LENGTH}
                      />
                      <div className="input-info">
                        <span className={`char-count ${editForm.description.length > MAX_DESCRIPTION_LENGTH ? 'error' : ''}`}>
                          {editForm.description.length}/{MAX_DESCRIPTION_LENGTH}
                        </span>
                      </div>
                      {editErrors.description && <div className="error-message">{editErrors.description}</div>}
                    </div>

                    <div className="form-group">
                      <label>Tags:</label>
                      <input
                        type="text"
                        value={editForm.tags}
                        onChange={(e) => handleEditInputChange('tags', e.target.value)}
                        className="edit-input"
                        placeholder="comma, separated, tags"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default VideoManagement;
