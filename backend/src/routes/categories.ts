import express from 'express';
import Video from '../models/Video';

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Video.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', videoCount: { $sum: 1 } } },
      { $project: { name: '$_id', videoCount: 1, _id: 0 } },
      { $sort: { name: 1 } }
    ]);
    
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get videos by category
router.get('/:categoryName/videos', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const videos = await Video.find({
      category: req.params.categoryName,
      isActive: true
    })
    .sort({ uploadDate: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
    
    res.json({ videos });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch category videos' });
  }
});

export default router;
