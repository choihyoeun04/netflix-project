import axios from 'axios';
import { apiCache } from '../utils/cache';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export interface Video {
  _id: string;
  title: string;
  description: string;
  category: string;
  duration: number;
  uploadDate: string;
  views: number;
  tags: string[];
}

const cachedRequest = async (url: string, params?: any, ttl?: number) => {
  const cacheKey = apiCache.generateKey(url, params);
  
  // Check cache first
  const cached = apiCache.get(cacheKey);
  if (cached) return cached;
  
  // Make request and cache result
  const response = await api.get(url, { params });
  apiCache.set(cacheKey, response, ttl);
  
  return response;
};

export const videoAPI = {
  getAll: (page = 1, limit = 20, category?: string) =>
    cachedRequest('/videos', { page, limit, category }, 2 * 60 * 1000), // 2 min cache
  
  getById: (id: string) =>
    cachedRequest(`/videos/${id}`, null, 10 * 60 * 1000), // 10 min cache
  
  getStreamUrl: (id: string) =>
    `${API_BASE_URL}/videos/${id}/stream`,
  
  getThumbnailUrl: (id: string) =>
    `${API_BASE_URL}/videos/${id}/thumbnail`,
  
  upload: (formData: FormData) => {
    // Clear cache after upload
    apiCache.clear();
    return api.post('/videos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  incrementView: (id: string) =>
    api.post(`/videos/${id}/view`),
  
  updateThumbnail: (id: string, thumbnailFile: File) => {
    const formData = new FormData();
    formData.append('thumbnail', thumbnailFile);
    return api.put(`/videos/${id}/thumbnail`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  delete: (id: string) => {
    // Clear cache after deletion
    apiCache.clear();
    return api.delete(`/videos/${id}`);
  },
  
  update: (id: string, data: { title?: string; description?: string; category?: string; tags?: string }) => {
    // Clear cache after update
    apiCache.clear();
    return api.put(`/videos/${id}`, data);
  }
};

export const searchAPI = {
  search: (query: string, page = 1, limit = 20) =>
    cachedRequest('/search', { q: query, page, limit }, 1 * 60 * 1000) // 1 min cache
};

export const categoryAPI = {
  getAll: () => cachedRequest('/categories', null, 10 * 60 * 1000), // 10 min cache
  getVideos: (categoryName: string, page = 1, limit = 20) =>
    cachedRequest(`/categories/${categoryName}/videos`, { page, limit }, 5 * 60 * 1000) // 5 min cache
};

export default api;
