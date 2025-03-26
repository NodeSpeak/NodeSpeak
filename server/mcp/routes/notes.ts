import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { HACKMD_CONFIG } from '../config';
import { verifySession } from './auth';
import logger from '../utils/logger';
import { MCPError, ErrorType } from '../utils/error-handler';

const router = Router();

// Get a list of notes
router.get('/', verifySession, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await axios.get(`${HACKMD_CONFIG.API_URL}/notes`, {
      headers: {
        Authorization: `Bearer ${req.session.hackmdToken}`
      },
      params: req.query
    });
    
    res.status(200).json(response.data);
  } catch (error) {
    next(error);
  }
});

// Get a specific note by ID
router.get('/:noteId', verifySession, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { noteId } = req.params;
    
    const response = await axios.get(`${HACKMD_CONFIG.API_URL}/notes/${noteId}`, {
      headers: {
        Authorization: `Bearer ${req.session.hackmdToken}`
      }
    });
    
    res.status(200).json(response.data);
  } catch (error) {
    next(error);
  }
});

// Create a new note
router.post('/', verifySession, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, content, readPermission, writePermission } = req.body;
    
    if (!title) {
      throw new MCPError('Title is required', 400, ErrorType.VALIDATION);
    }
    
    const response = await axios.post(`${HACKMD_CONFIG.API_URL}/notes`, 
      {
        title,
        content: content || '',
        readPermission: readPermission || 'owner',
        writePermission: writePermission || 'owner'
      },
      {
        headers: {
          Authorization: `Bearer ${req.session.hackmdToken}`
        }
      }
    );
    
    res.status(201).json(response.data);
  } catch (error) {
    next(error);
  }
});

// Update an existing note
router.put('/:noteId', verifySession, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { noteId } = req.params;
    const { title, content, readPermission, writePermission } = req.body;
    
    const updateData: any = {};
    if (title) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (readPermission) updateData.readPermission = readPermission;
    if (writePermission) updateData.writePermission = writePermission;
    
    const response = await axios.patch(`${HACKMD_CONFIG.API_URL}/notes/${noteId}`, 
      updateData,
      {
        headers: {
          Authorization: `Bearer ${req.session.hackmdToken}`
        }
      }
    );
    
    res.status(200).json(response.data);
  } catch (error) {
    next(error);
  }
});

// Delete a note
router.delete('/:noteId', verifySession, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { noteId } = req.params;
    
    await axios.delete(`${HACKMD_CONFIG.API_URL}/notes/${noteId}`, {
      headers: {
        Authorization: `Bearer ${req.session.hackmdToken}`
      }
    });
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Get note history
router.get('/:noteId/history', verifySession, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { noteId } = req.params;
    
    const response = await axios.get(`${HACKMD_CONFIG.API_URL}/notes/${noteId}/history`, {
      headers: {
        Authorization: `Bearer ${req.session.hackmdToken}`
      }
    });
    
    res.status(200).json(response.data);
  } catch (error) {
    next(error);
  }
});

// Create a note from template
router.post('/from-template', verifySession, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { templateId, title, variables } = req.body;
    
    if (!templateId || !title) {
      throw new MCPError('Template ID and title are required', 400, ErrorType.VALIDATION);
    }
    
    const response = await axios.post(`${HACKMD_CONFIG.API_URL}/templates/${templateId}/notes`, 
      {
        title,
        variables: variables || {}
      },
      {
        headers: {
          Authorization: `Bearer ${req.session.hackmdToken}`
        }
      }
    );
    
    res.status(201).json(response.data);
  } catch (error) {
    next(error);
  }
});

export default router;
