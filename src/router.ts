import express, { Request, Response } from 'express';
import notionService from './notion';
import { handleError, AppError } from './utils/error';
import logger from './utils/logger';

const router = express.Router();

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Create a new memo
router.post('/memo', async (req: Request, res: Response) => {
  try {
    const { content, tags } = req.body;
    
    if (!content) {
      throw new AppError('Content is required', 400);
    }
    
    const memo = await notionService.createMemo(content, tags || []);
    
    res.status(201).json({
      status: 'success',
      data: {
        memo
      }
    });
  } catch (error) {
    handleError(error, res);
  }
});

// Get memos with optional tag filter
router.get('/memos', async (req: Request, res: Response) => {
  try {
    const tag = req.query.tag as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    
    const memos = await notionService.getMemos(tag, limit);
    
    res.status(200).json({
      status: 'success',
      results: memos.length,
      data: {
        memos
      }
    });
  } catch (error) {
    handleError(error, res);
  }
});

// Delete a memo
router.delete('/memo/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      throw new AppError('Memo ID is required', 400);
    }
    
    const success = await notionService.deleteMemo(id);
    
    res.status(200).json({
      status: 'success',
      data: {
        success
      }
    });
  } catch (error) {
    handleError(error, res);
  }
});

// Update a memo
router.patch('/memo/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, tags } = req.body;
    
    if (!id) {
      throw new AppError('Memo ID is required', 400);
    }
    
    if (!content && !tags) {
      throw new AppError('Content or tags is required for update', 400);
    }
    
    const memo = await notionService.updateMemo(id, content, tags);
    
    res.status(200).json({
      status: 'success',
      data: {
        memo
      }
    });
  } catch (error) {
    handleError(error, res);
  }
});

export default router;
