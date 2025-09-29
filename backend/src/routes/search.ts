import express from 'express';
import Video from '../models/Video';

const router = express.Router();

// Search videos
router.get('/', async (req, res) => {
  try {
    const query = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    if (!query) return res.status(400).json({ error: 'Search query required' });
    
    const results = await Video.find({
      $text: { $search: query },
      isActive: true
    })
    .select('title description category uploadDate views')
    .limit(limit * 1)
    .skip((page - 1) * limit);
    
    const totalResults = await Video.countDocuments({
      $text: { $search: query },
      isActive: true
    });
    
    res.json({
      results,
      totalResults,
      query
    });
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
