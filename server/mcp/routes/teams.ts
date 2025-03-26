import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { HACKMD_CONFIG } from '../config';
import { verifySession } from './auth';
import logger from '../utils/logger';
import { MCPError, ErrorType } from '../utils/error-handler';

const router = Router();

// Get all teams the user is a member of
router.get('/', verifySession, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await axios.get(`${HACKMD_CONFIG.API_URL}/teams`, {
      headers: {
        Authorization: `Bearer ${req.session.hackmdToken}`
      }
    });
    
    res.status(200).json(response.data);
  } catch (error) {
    next(error);
  }
});

// Get a specific team by ID
router.get('/:teamId', verifySession, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.params;
    
    const response = await axios.get(`${HACKMD_CONFIG.API_URL}/teams/${teamId}`, {
      headers: {
        Authorization: `Bearer ${req.session.hackmdToken}`
      }
    });
    
    res.status(200).json(response.data);
  } catch (error) {
    next(error);
  }
});

// Get team members
router.get('/:teamId/members', verifySession, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.params;
    
    const response = await axios.get(`${HACKMD_CONFIG.API_URL}/teams/${teamId}/members`, {
      headers: {
        Authorization: `Bearer ${req.session.hackmdToken}`
      }
    });
    
    res.status(200).json(response.data);
  } catch (error) {
    next(error);
  }
});

// Get team notes
router.get('/:teamId/notes', verifySession, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.params;
    
    const response = await axios.get(`${HACKMD_CONFIG.API_URL}/teams/${teamId}/notes`, {
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

// Create a team note
router.post('/:teamId/notes', verifySession, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.params;
    const { title, content, readPermission, writePermission } = req.body;
    
    if (!title) {
      throw new MCPError('Title is required', 400, ErrorType.VALIDATION);
    }
    
    const response = await axios.post(`${HACKMD_CONFIG.API_URL}/teams/${teamId}/notes`, 
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

// Get team templates
router.get('/:teamId/templates', verifySession, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.params;
    
    const response = await axios.get(`${HACKMD_CONFIG.API_URL}/teams/${teamId}/templates`, {
      headers: {
        Authorization: `Bearer ${req.session.hackmdToken}`
      }
    });
    
    res.status(200).json(response.data);
  } catch (error) {
    next(error);
  }
});

// Create a team note from template
router.post('/:teamId/notes/from-template', verifySession, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { teamId } = req.params;
    const { templateId, title, variables } = req.body;
    
    if (!templateId || !title) {
      throw new MCPError('Template ID and title are required', 400, ErrorType.VALIDATION);
    }
    
    const response = await axios.post(`${HACKMD_CONFIG.API_URL}/teams/${teamId}/templates/${templateId}/notes`, 
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
