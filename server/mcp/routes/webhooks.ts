import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { HACKMD_CONFIG } from '../config';
import logger from '../utils/logger';
import { MCPError, ErrorType } from '../utils/error-handler';

const router = Router();

// Validate webhook signature
const validateWebhook = (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['x-hackmd-signature'] as string;
    if (!signature) {
      throw new MCPError('Missing HackMD signature', 401, ErrorType.AUTHENTICATION);
    }
    
    const payload = JSON.stringify(req.body);
    const hmac = crypto.createHmac('sha256', HACKMD_CONFIG.CLIENT_SECRET);
    const digest = hmac.update(payload).digest('hex');
    
    if (signature !== `sha256=${digest}`) {
      throw new MCPError('Invalid webhook signature', 401, ErrorType.AUTHENTICATION);
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

// Register webhook endpoint
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // The URL where HackMD will send webhook events
    const webhookUrl = `${req.protocol}://${req.get('host')}/webhooks/events`;
    
    // Register webhook with HackMD
    const response = await fetch(`${HACKMD_CONFIG.API_URL}/webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${req.session.hackmdToken}`
      },
      body: JSON.stringify({
        url: webhookUrl,
        events: ['note.create', 'note.update', 'note.delete', 'team.create', 'team.update']
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new MCPError(`Failed to register webhook: ${errorData.message}`, response.status, ErrorType.API_ERROR);
    }
    
    const data = await response.json();
    logger.info('Webhook registered successfully', data);
    
    res.status(201).json({
      success: true,
      message: 'Webhook registered successfully',
      webhook: data
    });
  } catch (error) {
    next(error);
  }
});

// Webhook events endpoint
router.post('/events', validateWebhook, (req: Request, res: Response) => {
  const event = req.body;
  const eventType = req.headers['x-hackmd-event'] as string;
  
  logger.info(`Received webhook event: ${eventType}`, event);
  
  // Process different event types
  switch (eventType) {
    case 'note.create':
      // Handle note creation event
      break;
    case 'note.update':
      // Handle note update event
      break;
    case 'note.delete':
      // Handle note deletion event
      break;
    case 'team.create':
    case 'team.update':
      // Handle team events
      break;
    default:
      logger.warn(`Unhandled webhook event type: ${eventType}`);
  }
  
  // Always acknowledge the webhook
  res.status(200).json({ success: true });
});

// List registered webhooks
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await fetch(`${HACKMD_CONFIG.API_URL}/webhooks`, {
      headers: {
        'Authorization': `Bearer ${req.session.hackmdToken}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new MCPError(`Failed to get webhooks: ${errorData.message}`, response.status, ErrorType.API_ERROR);
    }
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});

// Delete a webhook
router.delete('/:webhookId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { webhookId } = req.params;
    
    const response = await fetch(`${HACKMD_CONFIG.API_URL}/webhooks/${webhookId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${req.session.hackmdToken}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new MCPError(`Failed to delete webhook: ${errorData.message}`, response.status, ErrorType.API_ERROR);
    }
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
