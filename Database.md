# Database Schema Design

## MongoDB Collections

### 1. Videos Collection
```javascript
{
  _id: ObjectId,
  title: String,              // Video title
  description: String,        // Video description
  category: String,           // Video category (Action, Comedy, etc.)
  duration: Number,           // Duration in seconds
  fileId: ObjectId,          // GridFS file reference
  thumbnailId: ObjectId,     // GridFS thumbnail reference
  uploadDate: Date,          // Upload timestamp
  views: Number,             // View count
  tags: [String],            // Array of tags for search
  metadata: {
    resolution: String,      // "1080p", "720p", etc.
    fileSize: Number,        // File size in bytes
    format: String,          // "mp4", "webm", etc.
    codec: String           // Video codec information
  },
  isActive: Boolean,         // Soft delete flag
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
// Text search index
db.videos.createIndex({
  "title": "text",
  "description": "text",
  "tags": "text"
})

// Category and date indexes
db.videos.createIndex({ "category": 1 })
db.videos.createIndex({ "uploadDate": -1 })
db.videos.createIndex({ "views": -1 })
db.videos.createIndex({ "isActive": 1 })

// Compound index for category + date
db.videos.createIndex({ "category": 1, "uploadDate": -1 })
```

### 2. Categories Collection
```javascript
{
  _id: ObjectId,
  name: String,              // Category name (unique)
  description: String,       // Category description
  displayOrder: Number,      // Order for UI display
  isActive: Boolean,         // Active/inactive flag
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
db.categories.createIndex({ "name": 1 }, { unique: true })
db.categories.createIndex({ "displayOrder": 1 })
```

### 3. View Analytics Collection
```javascript
{
  _id: ObjectId,
  videoId: ObjectId,         // Reference to videos collection
  viewDate: Date,            // When the view occurred
  sessionId: String,         // Browser session identifier
  userAgent: String,         // Browser/device information
  duration: Number,          // How long they watched (seconds)
  completed: Boolean,        // Whether they watched to the end
  createdAt: Date
}
```

**Indexes:**
```javascript
db.viewAnalytics.createIndex({ "videoId": 1, "viewDate": -1 })
db.viewAnalytics.createIndex({ "viewDate": -1 })
db.viewAnalytics.createIndex({ "sessionId": 1 })
```

### 4. Search Queries Collection (Optional - for analytics)
```javascript
{
  _id: ObjectId,
  query: String,             // Search term
  resultsCount: Number,      // Number of results returned
  clickedResults: [ObjectId], // Videos that were clicked
  searchDate: Date,
  sessionId: String,
  createdAt: Date
}
```

## GridFS Collections (Automatic)

### 1. fs.files (Video Files)
```javascript
{
  _id: ObjectId,
  length: Number,            // File size in bytes
  chunkSize: Number,         // Chunk size (default 255KB)
  uploadDate: Date,
  filename: String,          // Original filename
  contentType: String,       // MIME type (video/mp4, etc.)
  metadata: {
    videoId: ObjectId,       // Reference to videos collection
    originalName: String,    // Original uploaded filename
    encoding: String         // File encoding
  }
}
```

### 2. fs.chunks (Video File Chunks)
```javascript
{
  _id: ObjectId,
  files_id: ObjectId,        // Reference to fs.files
  n: Number,                 // Chunk sequence number
  data: BinData              // Binary chunk data
}
```

### 3. Thumbnail GridFS (fs.thumbnails.files & fs.thumbnails.chunks)
Similar structure to video files but for thumbnail images.

## Database Configuration

### Connection Settings
```javascript
// MongoDB connection options
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}
```

### GridFS Configuration
```javascript
// GridFS bucket for videos
const videoBucket = new GridFSBucket(db, {
  bucketName: 'videos',
  chunkSizeBytes: 1024 * 255 // 255KB chunks
})

// GridFS bucket for thumbnails
const thumbnailBucket = new GridFSBucket(db, {
  bucketName: 'thumbnails',
  chunkSizeBytes: 1024 * 64 // 64KB chunks
})
```

## Data Relationships

### Video → GridFS Files
- `videos.fileId` → `fs.files._id`
- `videos.thumbnailId` → `fs.thumbnails.files._id`

### Video → Analytics
- `videos._id` → `viewAnalytics.videoId`

### Category → Videos
- `categories.name` → `videos.category` (string reference)

## Sample Data

### Sample Video Document
```javascript
{
  _id: ObjectId("64f8a1b2c3d4e5f6a7b8c9d0"),
  title: "Epic Action Movie Trailer",
  description: "An exciting trailer for the upcoming action blockbuster",
  category: "Action",
  duration: 180,
  fileId: ObjectId("64f8a1b2c3d4e5f6a7b8c9d1"),
  thumbnailId: ObjectId("64f8a1b2c3d4e5f6a7b8c9d2"),
  uploadDate: ISODate("2025-09-28T21:00:00Z"),
  views: 1250,
  tags: ["action", "trailer", "blockbuster", "adventure"],
  metadata: {
    resolution: "1080p",
    fileSize: 52428800,
    format: "mp4",
    codec: "H.264"
  },
  isActive: true,
  createdAt: ISODate("2025-09-28T21:00:00Z"),
  updatedAt: ISODate("2025-09-28T21:00:00Z")
}
```

## Performance Considerations

### Indexing Strategy
- Text search index for full-text search functionality
- Compound indexes for common query patterns
- TTL indexes for temporary data (if needed)

### Sharding Considerations (Future)
- Shard key: `category` + `uploadDate` for horizontal scaling
- GridFS automatically handles file distribution

### Backup Strategy
- Regular MongoDB dumps
- GridFS file backup procedures
- Point-in-time recovery setup
