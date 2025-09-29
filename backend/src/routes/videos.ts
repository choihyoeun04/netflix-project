import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import Video from '../models/Video';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const router = express.Router();

let videoBucket: GridFSBucket;
mongoose.connection.once('open', () => {
  videoBucket = new GridFSBucket(mongoose.connection.db!, { bucketName: 'videos' });
});

const upload = multer({ storage: multer.memoryStorage() });

// Helper function to generate thumbnail from video buffer
const generateThumbnailFromVideo = (videoBuffer: Buffer): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const tempVideoPath = path.join('/tmp', `temp_video_${Date.now()}.mp4`);
    const tempThumbnailPath = path.join('/tmp', `temp_thumb_${Date.now()}.jpg`);
    
    // Write video buffer to temporary file
    fs.writeFileSync(tempVideoPath, videoBuffer);
    
    // Use system ffmpeg to generate thumbnail
    const ffmpeg = spawn('ffmpeg', [
      '-i', tempVideoPath,
      '-ss', '00:00:02',  // Take screenshot at 2 seconds
      '-vframes', '1',    // Extract 1 frame
      '-vf', 'scale=320:180', // Resize to thumbnail size
      '-y',               // Overwrite output file
      tempThumbnailPath
    ]);
    
    ffmpeg.on('close', (code) => {
      // Clean up temp video file
      fs.unlinkSync(tempVideoPath);
      
      if (code === 0 && fs.existsSync(tempThumbnailPath)) {
        // Read generated thumbnail
        const thumbnailBuffer = fs.readFileSync(tempThumbnailPath);
        // Clean up temp thumbnail file
        fs.unlinkSync(tempThumbnailPath);
        resolve(thumbnailBuffer);
      } else {
        reject(new Error('Failed to generate thumbnail'));
      }
    });
    
    ffmpeg.on('error', (error) => {
      // Clean up temp files
      if (fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath);
      if (fs.existsSync(tempThumbnailPath)) fs.unlinkSync(tempThumbnailPath);
      reject(error);
    });
  });
};

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

// Stream video with range support for seeking
router.get('/:id/stream', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });
    
    // Get file info from GridFS
    const files = await videoBucket.find({ _id: video.fileId }).toArray();
    if (files.length === 0) {
      return res.status(404).json({ error: 'Video file not found' });
    }
    
    const file = files[0];
    const fileSize = file.length;
    const range = req.headers.range;
    
    if (range) {
      // Parse range header
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      
      // Set partial content headers
      res.status(206);
      res.set({
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize.toString(),
        'Content-Type': 'video/mp4',
      });
      
      // Create download stream with range
      const downloadStream = videoBucket.openDownloadStream(video.fileId, {
        start: start,
        end: end
      });
      
      downloadStream.on('error', () => {
        res.status(404).json({ error: 'Video file not found' });
      });
      
      downloadStream.pipe(res);
    } else {
      // No range requested, send entire file
      res.set({
        'Content-Length': fileSize.toString(),
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes'
      });
      
      const downloadStream = videoBucket.openDownloadStream(video.fileId);
      
      downloadStream.on('error', () => {
        res.status(404).json({ error: 'Video file not found' });
      });
      
      downloadStream.pipe(res);
    }
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
        // If thumbnail fails, generate default
        generateDefaultThumbnail(video, res);
      });
      
      res.set('Content-Type', 'image/jpeg');
      downloadStream.pipe(res);
    } else {
      // Generate default thumbnail
      generateDefaultThumbnail(video, res);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to get thumbnail' });
  }
});

// Helper function to generate default thumbnail
const generateDefaultThumbnail = (video: any, res: any) => {
  // Create SVG thumbnail with video info
  const svg = `
    <svg width="320" height="180" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1a1a1a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#333333;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill="url(#grad)" />
      <circle cx="160" cy="70" r="25" fill="#e50914" opacity="0.8"/>
      <polygon points="150,60 150,80 175,70" fill="white"/>
      <text x="160" y="110" font-family="Arial, sans-serif" font-size="14" font-weight="bold" 
            text-anchor="middle" fill="white">${video.title.substring(0, 25)}${video.title.length > 25 ? '...' : ''}</text>
      <text x="160" y="130" font-family="Arial, sans-serif" font-size="12" 
            text-anchor="middle" fill="#cccccc">${video.category}</text>
      <text x="160" y="150" font-family="Arial, sans-serif" font-size="10" 
            text-anchor="middle" fill="#999999">${video.views} views</text>
    </svg>
  `;
  
  res.set('Content-Type', 'image/svg+xml');
  res.send(svg);
};
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
      
      // Upload thumbnail if provided, otherwise generate from video
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
      } else {
        // Auto-generate thumbnail from video
        try {
          const thumbnailBuffer = await generateThumbnailFromVideo(videoFile.buffer);
          
          const autoThumbnailUploadStream = videoBucket.openUploadStream(
            `auto_thumb_${videoFile.originalname}.jpg`,
            { contentType: 'image/jpeg' }
          );
          
          autoThumbnailUploadStream.end(thumbnailBuffer);
          
          await new Promise((resolve, reject) => {
            autoThumbnailUploadStream.on('finish', () => {
              thumbnailId = autoThumbnailUploadStream.id;
              resolve(thumbnailId);
            });
            autoThumbnailUploadStream.on('error', reject);
          });
        } catch (error) {
          console.log('Failed to auto-generate thumbnail, will use default SVG');
          // thumbnailId remains null, will use SVG fallback
        }
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
