import React, { useState } from 'react';
import { videoAPI } from '../services/api';

interface UploadFormProps {
  onUploadSuccess: () => void;
}

const UploadForm: React.FC<UploadFormProps> = ({ onUploadSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Validate file type
      if (!selectedFile.type.startsWith('video/')) {
        setMessage('Please select a valid video file');
        setFile(null);
        return;
      }
      
      // Check file size (limit to 100MB)
      if (selectedFile.size > 100 * 1024 * 1024) {
        setMessage('File size must be less than 100MB');
        setFile(null);
        return;
      }
      
      setMessage('');
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file type
      if (!selectedFile.type.startsWith('image/')) {
        setMessage('Please select a valid image file for thumbnail');
        return;
      }
      
      // Check file size (limit to 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setMessage('Thumbnail file size must be less than 5MB');
        return;
      }
      
      setThumbnailFile(selectedFile);
      setMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select a video file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setMessage('');

    const uploadData = new FormData();
    uploadData.append('video', file);
    if (thumbnailFile) {
      uploadData.append('thumbnail', thumbnailFile);
    }
    uploadData.append('title', formData.title);
    uploadData.append('description', formData.description);
    uploadData.append('category', formData.category);
    uploadData.append('tags', formData.tags);

    try {
      // Simulate progress (since we can't track real upload progress easily)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      await videoAPI.upload(uploadData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setMessage('Video uploaded successfully!');
      
      // Reset form
      setFormData({ title: '', description: '', category: '', tags: '' });
      setFile(null);
      setThumbnailFile(null);
      
      // Reset file inputs
      const fileInput = document.getElementById('video') as HTMLInputElement;
      const thumbnailInput = document.getElementById('thumbnail') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      if (thumbnailInput) thumbnailInput.value = '';
      
      onUploadSuccess();
      
    } catch (error) {
      setMessage('Upload failed. Please try again.');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-form-container">
      <h2>Upload New Video</h2>
      
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label htmlFor="video">Video File:</label>
          <input
            type="file"
            id="video"
            accept="video/*"
            onChange={handleFileChange}
            required
            disabled={uploading}
          />
          {file && (
            <div className="file-info">
              <span>📹 {file.name}</span>
              <span>({(file.size / (1024 * 1024)).toFixed(1)} MB)</span>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="thumbnail">Thumbnail Image (Optional):</label>
          <input
            type="file"
            id="thumbnail"
            accept="image/*"
            onChange={handleThumbnailChange}
            disabled={uploading}
          />
          {thumbnailFile && (
            <div className="file-info">
              <span>🖼️ {thumbnailFile.name}</span>
              <span>({(thumbnailFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="title">Title:</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              disabled={uploading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category:</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              disabled={uploading}
            >
              <option value="">Select Category</option>
              <option value="Action">Action</option>
              <option value="Comedy">Comedy</option>
              <option value="Drama">Drama</option>
              <option value="Horror">Horror</option>
              <option value="Sci-Fi">Sci-Fi</option>
              <option value="Documentary">Documentary</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            required
            disabled={uploading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="tags">Tags (comma-separated):</label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleInputChange}
            placeholder="action, adventure, thriller"
            disabled={uploading}
          />
        </div>

        {uploading && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <span>{uploadProgress}% uploaded</span>
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload Video'}
        </button>

        {message && (
          <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
};

export default UploadForm;
