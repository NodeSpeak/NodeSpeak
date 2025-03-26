import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { HACKMD_CONFIG } from '../config';
import logger from '../utils/logger';
import { MCPError, ErrorType } from '../utils/error-handler';

const router = Router();

// Helper function to verify session
export const verifySession = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.hackmdToken) {
    return next(new MCPError('Unauthorized: No valid HackMD session', 401, ErrorType.AUTHENTICATION));
  }
  next();
};

// Start OAuth flow with HackMD
router.get('/login', (req: Request, res: Response) => {
  const authUrl = `${HACKMD_CONFIG.API_URL}/oauth2/authorize?client_id=${HACKMD_CONFIG.CLIENT_ID}&redirect_uri=${encodeURIComponent(HACKMD_CONFIG.CALLBACK_URL)}&response_type=code`;
  res.redirect(authUrl);
});

// OAuth callback from HackMD
router.get('/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      throw new MCPError('No authorization code received', 400, ErrorType.VALIDATION);
    }
    
    // Exchange code for token
    const tokenResponse = await axios.post(`${HACKMD_CONFIG.API_URL}/oauth2/token`, {
      grant_type: 'authorization_code',
      code,
      client_id: HACKMD_CONFIG.CLIENT_ID,
      client_secret: HACKMD_CONFIG.CLIENT_SECRET,
      redirect_uri: HACKMD_CONFIG.CALLBACK_URL
    });
    
    // Store the token in session
    req.session.hackmdToken = tokenResponse.data.access_token;
    req.session.refreshToken = tokenResponse.data.refresh_token;
    req.session.tokenExpiresAt = Date.now() + tokenResponse.data.expires_in * 1000;
    
    logger.info('HackMD authentication successful');
    
    // Redirect to the application
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
  } catch (error) {
    next(error);
  }
});

// Refresh token endpoint
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.session.refreshToken) {
      throw new MCPError('No refresh token available', 401, ErrorType.AUTHENTICATION);
    }
    
    const tokenResponse = await axios.post(`${HACKMD_CONFIG.API_URL}/oauth2/token`, {
      grant_type: 'refresh_token',
      refresh_token: req.session.refreshToken,
      client_id: HACKMD_CONFIG.CLIENT_ID,
      client_secret: HACKMD_CONFIG.CLIENT_SECRET
    });
    
    // Update the token in session
    req.session.hackmdToken = tokenResponse.data.access_token;
    req.session.refreshToken = tokenResponse.data.refresh_token;
    req.session.tokenExpiresAt = Date.now() + tokenResponse.data.expires_in * 1000;
    
    logger.info('HackMD token refreshed successfully');
    
    res.status(200).json({ success: true, message: 'Token refreshed successfully' });
  } catch (error) {
    next(error);
  }
});

// Logout endpoint
router.get('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      logger.error('Error destroying session', err);
    }
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
  });
});

// Get current user profile
router.get('/me', verifySession, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await axios.get(`${HACKMD_CONFIG.API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${req.session.hackmdToken}`
      }
    });
    
    res.status(200).json(response.data);
  } catch (error) {
    next(error);
  }
});

export default router;
