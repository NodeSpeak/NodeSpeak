import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { MCP_CONFIG, HACKMD_CONFIG } from './config';
import bodyParser from 'body-parser';
import axios from 'axios';
import logger from './utils/logger';
import { handleError } from './utils/error-handler';

// Import routes
import authRoutes from './routes/auth';
import notesRoutes from './routes/notes';
import teamsRoutes from './routes/teams';
import webhookRoutes from './routes/webhooks';

const app = express();

// Middleware setup
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: MCP_CONFIG.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'NodeSpeak HackMD MCP' });
});

// Register routes
app.use('/auth', authRoutes);
app.use('/notes', notesRoutes);
app.use('/teams', teamsRoutes);
app.use('/webhooks', webhookRoutes);

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  handleError(err, res);
});

// Start the server
const start = async () => {
  try {
    app.listen(MCP_CONFIG.PORT, () => {
      logger.info(`HackMD MCP Server running on http://${MCP_CONFIG.HOST}:${MCP_CONFIG.PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start HackMD MCP server', error);
    process.exit(1);
  }
};

// Initialize the server
if (require.main === module) {
  start();
}

export default app;
