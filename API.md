# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Video APIs

### 1. Get All Videos
```http
GET /videos
```
**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of videos per page (default: 20)
- `category` (optional): Filter by category

**Response:**
```json
{
  "videos": [
    {
      "_id": "video_id",
      "title": "Video Title",
      "description": "Video description",
      "category": "Action",
      "duration": 7200,
      "thumbnail": "thumbnail_url",
      "uploadDate": "2025-09-28T21:00:00Z",
      "views": 1250,
      "tags": ["action", "adventure"]
    }
  ],
  "totalPages": 5,
  "currentPage": 1,
  "totalVideos": 100
}
```

### 2. Get Video by ID
```http
GET /videos/:id
```
**Response:**
```json
{
  "_id": "video_id",
  "title": "Video Title",
  "description": "Video description",
  "category": "Action",
  "duration": 7200,
  "thumbnail": "thumbnail_url",
  "uploadDate": "2025-09-28T21:00:00Z",
  "views": 1250,
  "tags": ["action", "adventure"]
}
```

### 3. Stream Video
```http
GET /videos/:id/stream
```
**Headers:**
- `Range` (optional): For partial content requests

**Response:**
- Video stream with appropriate headers for browser playback
- Content-Type: video/mp4
- Accept-Ranges: bytes

### 4. Upload Video (Admin)
```http
POST /videos/upload
```
**Content-Type:** multipart/form-data

**Body:**
```
video: [video file]
title: "Video Title"
description: "Video description"
category: "Action"
tags: "action,adventure,thriller"
```

**Response:**
```json
{
  "message": "Video uploaded successfully",
  "videoId": "new_video_id"
}
```

### 5. Update Video Metadata (Admin)
```http
PUT /videos/:id
```
**Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "category": "Drama",
  "tags": ["drama", "romance"]
}
```

### 6. Delete Video (Admin)
```http
DELETE /videos/:id
```

## Search APIs

### 1. Search Videos
```http
GET /search
```
**Query Parameters:**
- `q`: Search query (required)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20)

**Response:**
```json
{
  "results": [
    {
      "_id": "video_id",
      "title": "Video Title",
      "description": "Video description",
      "category": "Action",
      "thumbnail": "thumbnail_url",
      "relevanceScore": 0.95
    }
  ],
  "totalResults": 15,
  "query": "search term"
}
```

## Category APIs

### 1. Get All Categories
```http
GET /categories
```
**Response:**
```json
{
  "categories": [
    {
      "name": "Action",
      "videoCount": 25
    },
    {
      "name": "Comedy",
      "videoCount": 18
    }
  ]
}
```

### 2. Get Videos by Category
```http
GET /categories/:categoryName/videos
```
**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Videos per page (default: 20)

## Analytics APIs

### 1. Increment View Count
```http
POST /videos/:id/view
```
**Response:**
```json
{
  "message": "View count updated",
  "newViewCount": 1251
}
```

### 2. Get Popular Videos
```http
GET /videos/popular
```
**Query Parameters:**
- `limit` (optional): Number of videos (default: 10)
- `timeframe` (optional): "day", "week", "month", "all" (default: "week")

## File APIs

### 1. Get Video Thumbnail
```http
GET /thumbnails/:videoId
```
**Response:** Image file (JPEG/PNG)

### 2. Upload Thumbnail (Admin)
```http
POST /videos/:id/thumbnail
```
**Content-Type:** multipart/form-data
**Body:**
```
thumbnail: [image file]
```

## Error Responses

### Standard Error Format
```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `413` - Payload Too Large (for large video uploads)
- `500` - Internal Server Error

## Rate Limiting
- Upload endpoints: 5 requests per minute
- Search endpoints: 100 requests per minute
- Video streaming: No limit
- General APIs: 1000 requests per hour
