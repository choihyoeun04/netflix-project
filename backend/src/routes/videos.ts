import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import Video from '../models/Video';

const router = express.Router();

let videoBucket: GridFSBucket;
mongoose.connection.once('open', () => {
  videoBucket = new GridFSBucket(mongoose.connection.db!, { bucketName: 'videos' });
});

const upload = multer({ storage: multer.memoryStorage() });

// Get all videos
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string;
    
    const filter: any = { isActive: true };
    if (category) filter.category = category;
    
    const videos = await Video.find(filter)
      .sort({ uploadDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Video.countDocuments(filter);
    
    res.json({
      videos,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalVideos: total
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Get video by ID
router.get('/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });
    res.json(video);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch video' });
  }
});

// Stream video
router.get('/:id/stream', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });
    
    const downloadStream = videoBucket.openDownloadStream(video.fileId);
    
    downloadStream.on('error', () => {
      res.status(404).json({ error: 'Video file not found' });
    });
    
    res.set('Content-Type', 'video/mp4');
    downloadStream.pipe(res);
  } catch (error) {
    res.status(500).json({ error: 'Failed to stream video' });
  }
});

// Update video details
router.put('/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });
    
    const { title, description, category, tags } = req.body;
    
    if (title) video.title = title;
    if (description) video.description = description;
    if (category) video.category = category;
    if (tags) video.tags = tags.split(',').map((tag: string) => tag.trim());
    
    await video.save();
    res.json({ message: 'Video updated successfully', video });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update video' });
  }
});

// Update video thumbnail
router.put('/:id/thumbnail', upload.single('thumbnail'), async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });
    
    if (!req.file) return res.status(400).json({ error: 'No thumbnail file provided' });
    
    // Delete old thumbnail if exists
    if (video.thumbnailId) {
      try {
        await videoBucket.delete(video.thumbnailId);
      } catch (error) {
        console.log('Old thumbnail not found, continuing...');
      }
    }
    
    // Upload new thumbnail
    const thumbnailUploadStream = videoBucket.openUploadStream(
      `thumb_${req.file.originalname}`,
      { contentType: req.file.mimetype }
    );
    
    thumbnailUploadStream.end(req.file.buffer);
    
    thumbnailUploadStream.on('finish', async () => {
      video.thumbnailId = thumbnailUploadStream.id;
      await video.save();
      res.json({ message: 'Thumbnail updated successfully' });
    });
    
    thumbnailUploadStream.on('error', () => {
      res.status(500).json({ error: 'Failed to upload thumbnail' });
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update thumbnail' });
  }
});
router.get('/:id/thumbnail', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });
    
    if (video.thumbnailId) {
      const downloadStream = videoBucket.openDownloadStream(video.thumbnailId);
      
      downloadStream.on('error', () => {
        // If no thumbnail, send default placeholder
        res.status(404).json({ error: 'Thumbnail not found' });
      });
      
      res.set('Content-Type', 'image/jpeg');
      downloadStream.pipe(res);
    } else {
      res.status(404).json({ error: 'No thumbnail available' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to get thumbnail' });
  }
});
router.post('/upload', upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (!files.video || !files.video[0]) {
      return res.status(400).json({ error: 'No video file provided' });
    }
    
    const videoFile = files.video[0];
    const thumbnailFile = files.thumbnail ? files.thumbnail[0] : null;
    
    // Upload video
    const videoUploadStream = videoBucket.openUploadStream(videoFile.originalname, {
      contentType: videoFile.mimetype
    });
    
    videoUploadStream.end(videoFile.buffer);
    
    videoUploadStream.on('finish', async () => {
      let thumbnailId = null;
      
      // Upload thumbnail if provided
      if (thumbnailFile) {
        const thumbnailUploadStream = videoBucket.openUploadStream(
          `thumb_${thumbnailFile.originalname}`,
          { contentType: thumbnailFile.mimetype }
        );
        
        thumbnailUploadStream.end(thumbnailFile.buffer);
        
        await new Promise((resolve, reject) => {
          thumbnailUploadStream.on('finish', () => {
            thumbnailId = thumbnailUploadStream.id;
            resolve(thumbnailId);
          });
          thumbnailUploadStream.on('error', reject);
        });
      }
      
      const video = new Video({
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        tags: req.body.tags ? req.body.tags.split(',') : [],
        fileId: videoUploadStream.id,
        thumbnailId: thumbnailId,
        metadata: {
          fileSize: videoFile.size,
          format: videoFile.mimetype.split('/')[1]
        }
      });
      
      await video.save();
      res.json({ message: 'Video uploaded successfully', videoId: video._id });
    });
    
    videoUploadStream.on('error', () => {
      res.status(500).json({ error: 'Failed to upload video' });
    });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Increment view count
router.post('/:id/view', async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!video) return res.status(404).json({ error: 'Video not found' });
    res.json({ message: 'View count updated', newViewCount: video.views });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update view count' });
  }
});

// Delete video
router.delete('/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });
    
    // Delete video file from GridFS
    try {
      await videoBucket.delete(video.fileId);
    } catch (error) {
      console.log('Video file not found in GridFS, continuing...');
    }
    
    // Delete thumbnail file if exists
    if (video.thumbnailId) {
      try {
        await videoBucket.delete(video.thumbnailId);
      } catch (error) {
        console.log('Thumbnail file not found in GridFS, continuing...');
      }
    }
    
    // Delete video document
    await Video.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

export default router;
