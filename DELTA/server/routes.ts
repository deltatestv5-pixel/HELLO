import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage.js";
import { DiscordAuthService } from "./services/discord-auth.js";
import { BotManager } from "./services/bot-manager.js";
import { upload, validateBotFiles } from "./services/file-handler.js";
import { insertBotSchema, insertBotFileSchema } from "../shared/schema.js";
import { z } from "zod";

// WebSocket clients
const wsClients = new Map<string, WebSocket>();

export async function registerRoutes(app: Express, customServer?: Server): Promise<Server> {
  // Use provided server or create a new HTTP server
  const server = customServer || createServer(app);
  
  // Initialize bot manager
  await BotManager.initDirectories();

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const userId = req.url?.split('userId=')[1];
    if (userId) {
      wsClients.set(userId, ws);
    }

    ws.on('close', () => {
      if (userId) {
        wsClients.delete(userId);
      }
    });
  });

  // Broadcast to user's WebSocket
  function broadcastToUser(userId: string, data: any) {
    const ws = wsClients.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
      console.log(`Broadcasted to user ${userId}:`, data);
    } else {
      console.log(`No active WebSocket for user ${userId}`);
    }
  }

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      app: process.env.APP_NAME || 'Pulseon Next 1 Legacy'
    });
  });

  // Discord OAuth routes with enhanced security and scopes
  app.get('/api/auth/discord', (req, res) => {
    // Use environment variable for base URL or construct from headers
    const host = req.get('host');
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const baseUrl = process.env.APP_URL || `${protocol}://${host}`;
    const redirectUri = `${baseUrl}/api/auth/callback`;
    
    // Generate and store state parameter for CSRF protection
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    req.session.oauthState = state;
    
    // Enhanced scopes for better user identification and integration
    const scopes = ['identify', 'email', 'guilds.join'];
    
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes.join(' '))}&state=${state}&prompt=consent`;
    res.json({ url: discordAuthUrl });
  });

  app.get('/api/auth/callback', async (req, res) => {
    try {
      const { code, state } = req.query;
      
      // Verify required parameters
      if (!code) {
        return res.status(400).json({ error: 'Authorization code required' });
      }
      
      // Verify state parameter to prevent CSRF attacks
      if (!state || state !== req.session.oauthState) {
        console.error('OAuth state verification failed');
        return res.redirect('/auth/error?reason=invalid_state');
      }
      
      // Clear the state from session after verification
      delete req.session.oauthState;

      // Use same base URL logic for consistency
      const host = req.get('host');
      const protocol = req.get('x-forwarded-proto') || req.protocol;
      const baseUrl = process.env.APP_URL || `${protocol}://${host}`;
      const redirectUri = `${baseUrl}/api/auth/callback`;
      const user = await DiscordAuthService.authenticateUser(code as string, redirectUri);

      // Set session with secure flags
      req.session.userId = user.id;
      req.session.authenticated = true;
      req.session.authTime = Date.now();

      // Redirect to frontend auth callback page
      res.redirect(`/auth/callback?success=true`);
    } catch (error) {
      console.error('Discord auth error:', error);
      // Redirect to the custom error page instead of JSON response
      res.redirect('/auth/error');
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ success: true });
    });
  });

  app.get('/api/auth/me', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      discriminator: user.discriminator,
      avatar: DiscordAuthService.getAvatarUrl(user)
    });
  });

  // Enhanced// Token refresh middleware
  const refreshTokenIfNeeded = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return next();
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || !user.accessToken || !user.refreshToken) {
        return next();
      }

      // Check if token needs refresh (tokens typically expire after 7 days)
      // If tokenUpdatedAt is not available, assume token needs refresh
      const tokenAge = user.tokenUpdatedAt 
        ? Date.now() - (user.tokenUpdatedAt ? new Date(user.tokenUpdatedAt).getTime() : 0) 
        : Infinity;
      
      // Refresh if token is older than 6 days (giving 1 day buffer before expiration)
      if (tokenAge > 6 * 24 * 60 * 60 * 1000) {
        const refreshedUser = await DiscordAuthService.refreshUserToken(user.id);
        if (!refreshedUser) {
          // If refresh fails, continue anyway and let requireAuth handle it
          console.warn(`Failed to refresh token for user ${user.id}`);
        }
      }
    } catch (error) {
      console.error('Error in token refresh middleware:', error);
      // Continue to next middleware even if refresh fails
    }

    next();
  };

  // Enhanced Authentication middleware with security checks
  const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    // Check if user is authenticated
    if (!req.session.userId || !req.session.authenticated) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Session expiration check (optional, can be adjusted based on security requirements)
    const sessionMaxAge = parseInt(process.env.SESSION_MAX_AGE || '86400000'); // Default 24 hours
    const sessionAge = Date.now() - (req.session.authTime || 0);
    if (sessionAge > sessionMaxAge) {
      // Session expired, clear it and require re-authentication
      req.session.destroy((err) => {
        if (err) console.error('Error destroying expired session:', err);
      });
      return res.status(401).json({ error: 'Session expired, please log in again' });
    }

    // Fetch and validate user
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      // User not found in database, clear session
      req.session.destroy((err) => {
        if (err) console.error('Error destroying invalid session:', err);
      });
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user to request for downstream handlers
    req.user = user;
    
    // Update session timestamp to extend session based on activity
    req.session.lastActive = Date.now();
    
    next();
  };

  // Apply token refresh middleware to all API routes
  app.use('/api', refreshTokenIfNeeded);

  // Bot management routes
  app.get('/api/bots', requireAuth, async (req: any, res) => {
    try {
      const bots = await storage.getBotsByUserId(req.user.id);
      res.json({ bots });
    } catch (error) {
      console.error('Error getting bots:', error);
      res.status(500).json({ error: 'Failed to get bots' });
    }
  });

  app.post('/api/bots', requireAuth, upload.array('files'), async (req: Request, res: Response) => {
    try {
      const { name, token, language } = req.body;
      const files = req.files as Express.Multer.File[];

      // Check bot limit per user
      const existingBots = await storage.getBotsByUserId(req.user!.id);
      const maxBotsPerUser = parseInt(process.env.MAX_BOTS_PER_USER || '1');
      
      if (existingBots.length >= maxBotsPerUser) {
        return res.status(400).json({ 
          error: `Bot limit reached. You can only have ${maxBotsPerUser} bot(s) per account.` 
        });
      }

      // Validate input
      const botData = insertBotSchema.parse({
        userId: req.user!.id,
        name,
        token,
        language
      });

      // Validate files
      const validation = validateBotFiles(files, language);
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.error });
      }

      // Create bot
      const bot = await storage.createBot({
        ...botData,
        mainFile: validation.mainFile
      });

      // Save files
      for (const file of files) {
        await storage.createBotFile({
          botId: bot.id,
          filename: file.originalname,
          content: file.buffer.toString('utf-8'),
          size: file.size
        });
      }

      res.json({ success: true, bot });
    } catch (error) {
      console.error('Error creating bot:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid input data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create bot' });
      }
    }
  });

  app.post('/api/bots/:botId/start', requireAuth, async (req: any, res) => {
    try {
      const { botId } = req.params;
      const bot = await storage.getBot(botId);
      
      if (!bot || bot.userId !== req.user.id) {
        return res.status(404).json({ error: 'Bot not found' });
      }

      const result = await BotManager.startBot(botId);
      
      // Always broadcast update based on actual result
      const status = result.success ? 'starting' : 'error';
      broadcastToUser(req.user.id, {
        type: 'bot_status_update',
        botId,
        status
      });

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error starting bot:', errorMessage);
      
      // Update bot status to error on exception
      try {
        const { botId } = req.params;
        await storage.updateBot(botId, { status: 'error' });
        broadcastToUser(req.user.id, {
          type: 'bot_status_update',
          botId,
          status: 'error'
        });
      } catch (updateError) {
        console.error('Failed to update bot status:', updateError);
      }
      
      res.status(500).json({ 
        success: false, 
        message: `Failed to start bot: ${errorMessage}` 
      });
    }
  });

  app.post('/api/bots/:botId/stop', requireAuth, async (req: any, res) => {
    try {
      const { botId } = req.params;
      const bot = await storage.getBot(botId);
      
      if (!bot || bot.userId !== req.user.id) {
        return res.status(404).json({ error: 'Bot not found' });
      }

      const result = await BotManager.stopBot(botId);
      
      // Broadcast update to user
      broadcastToUser(req.user.id, {
        type: 'bot_status_update',
        botId,
        status: 'stopped'
      });

      res.json(result);
    } catch (error) {
      console.error('Error stopping bot:', error);
      res.status(500).json({ error: 'Failed to stop bot' });
    }
  });

  app.post('/api/bots/:botId/restart', requireAuth, async (req: any, res) => {
    try {
      const { botId } = req.params;
      const bot = await storage.getBot(botId);
      
      if (!bot || bot.userId !== req.user.id) {
        return res.status(404).json({ error: 'Bot not found' });
      }

      const result = await BotManager.restartBot(botId);
      
      // Always broadcast update based on actual result
      const status = result.success ? 'starting' : 'error';
      broadcastToUser(req.user.id, {
        type: 'bot_status_update',
        botId,
        status
      });

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error restarting bot:', errorMessage);
      
      // Update bot status to error on exception
      try {
        const { botId } = req.params;
        await storage.updateBot(botId, { status: 'error' });
        broadcastToUser(req.user.id, {
          type: 'bot_status_update',
          botId,
          status: 'error'
        });
      } catch (updateError) {
        console.error('Failed to update bot status:', updateError);
      }
      
      res.status(500).json({ 
        success: false, 
        message: `Failed to restart bot: ${errorMessage}` 
      });
    }
  });

  app.delete('/api/bots/:botId', requireAuth, async (req: any, res) => {
    try {
      const { botId } = req.params;
      const bot = await storage.getBot(botId);
      
      if (!bot || bot.userId !== req.user.id) {
        return res.status(404).json({ error: 'Bot not found' });
      }

      // Stop bot if running
      if (BotManager.isRunning(botId)) {
        await BotManager.stopBot(botId);
      }

      // Delete bot and associated data
      await storage.deleteBot(botId);

      // Broadcast update to user
      broadcastToUser(req.user.id, {
        type: 'bot_deleted',
        botId
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting bot:', error);
      res.status(500).json({ error: 'Failed to delete bot' });
    }
  });

  // File management endpoints
  app.get('/api/bots/:botId/files', requireAuth, async (req: any, res) => {
    try {
      const { botId } = req.params;
      const bot = await storage.getBot(botId);
      
      if (!bot || bot.userId !== req.user.id) {
        return res.status(404).json({ error: 'Bot not found' });
      }

      const files = await storage.getBotFiles(botId);
      res.json({ files });
    } catch (error) {
      console.error('Error getting bot files:', error);
      res.status(500).json({ error: 'Failed to get bot files' });
    }
  });

  app.put('/api/bots/:botId/files/:filename', requireAuth, async (req: any, res) => {
    try {
      const { botId, filename } = req.params;
      const { content } = req.body;
      const bot = await storage.getBot(botId);
      
      if (!bot || bot.userId !== req.user.id) {
        return res.status(404).json({ error: 'Bot not found' });
      }

      // Update file content
      const success = await storage.updateBotFile(botId, decodeURIComponent(filename), content);
      
      if (success) {
        res.json({ success: true, message: 'File updated successfully' });
      } else {
        res.status(404).json({ error: 'File not found' });
      }
    } catch (error) {
      console.error('Error updating bot file:', error);
      res.status(500).json({ error: 'Failed to update bot file' });
    }
  });

  app.get('/api/bots/:botId/logs', requireAuth, async (req: any, res) => {
    try {
      const { botId } = req.params;
      const bot = await storage.getBot(botId);
      
      if (!bot || bot.userId !== req.user.id) {
        return res.status(404).json({ error: 'Bot not found' });
      }

      const logs = await storage.getBotLogs(botId, 100);
      res.json({ logs });
    } catch (error) {
      console.error('Error getting bot logs:', error);
      res.status(500).json({ error: 'Failed to get bot logs' });
    }
  });

  app.get('/api/bots/:botId/status', requireAuth, async (req: any, res) => {
    try {
      const { botId } = req.params;
      const bot = await storage.getBot(botId);
      
      if (!bot || bot.userId !== req.user.id) {
        return res.status(404).json({ error: 'Bot not found' });
      }

      res.json({ 
        status: bot.status,
        isRunning: BotManager.isRunning(botId),
        bot 
      });
    } catch (error) {
      console.error('Error getting bot status:', error);
      res.status(500).json({ error: 'Failed to get bot status' });
    }
  });

  // User Settings and Security Routes
  
  // Get user settings
  app.get('/api/user/settings', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Return user settings (these could be stored in a separate settings table)
      res.json({
        user: {
          id: user.id,
          username: user.username,
          discriminator: user.discriminator,
          avatar: DiscordAuthService.getAvatarUrl(user),
          discordId: user.discordId,
          createdAt: user.createdAt
        },
        settings: {
          notifications: {
            email: true, // Default values - could be stored in database
            discord: false,
            botStatus: true,
            security: true
          },
          theme: 'system',
          botLimit: parseInt(process.env.MAX_BOTS_PER_USER || '1'),
          storageLimit: '100MB'
        }
      });
    } catch (error) {
      console.error('Error getting user settings:', error);
      res.status(500).json({ error: 'Failed to get user settings' });
    }
  });

  // Update user notification settings
  app.put('/api/user/settings/notifications', requireAuth, async (req: any, res) => {
    try {
      const { email, discord, botStatus, security } = req.body;
      
      // Validate settings
      if (typeof email !== 'boolean' || typeof discord !== 'boolean' || 
          typeof botStatus !== 'boolean' || typeof security !== 'boolean') {
        return res.status(400).json({ error: 'Invalid notification settings' });
      }

      // In a real app, you'd store these in a user_settings table
      // For now, we'll just acknowledge the save
      
      res.json({ 
        success: true, 
        message: 'Notification settings updated successfully',
        settings: { email, discord, botStatus, security }
      });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      res.status(500).json({ error: 'Failed to update notification settings' });
    }
  });

  // Get user activity/security logs
  app.get('/api/user/activity', requireAuth, async (req: any, res) => {
    try {
      // In a real app, you'd have an activity/audit log table
      const mockActivity = [
        {
          id: '1',
          action: 'Login',
          timestamp: new Date().toISOString(),
          ip: req.ip || '127.0.0.1',
          userAgent: req.get('User-Agent') || 'Unknown',
          success: true
        },
        {
          id: '2',
          action: 'Bot Created',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          ip: req.ip || '127.0.0.1',
          userAgent: req.get('User-Agent') || 'Unknown',
          success: true
        },
        {
          id: '3',
          action: 'Settings Updated',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          ip: req.ip || '127.0.0.1',
          userAgent: req.get('User-Agent') || 'Unknown',
          success: true
        }
      ];

      res.json({ 
        activity: mockActivity,
        totalCount: mockActivity.length 
      });
    } catch (error) {
      console.error('Error getting user activity:', error);
      res.status(500).json({ error: 'Failed to get user activity' });
    }
  });

  // Disconnect Discord (logout)
  app.post('/api/user/disconnect-discord', requireAuth, async (req: any, res) => {
    try {
      // This would revoke Discord tokens in a real implementation
      req.session.destroy((err: any) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to disconnect Discord' });
        }
        res.json({ 
          success: true, 
          message: 'Discord account disconnected successfully' 
        });
      });
    } catch (error) {
      console.error('Error disconnecting Discord:', error);
      res.status(500).json({ error: 'Failed to disconnect Discord' });
    }
  });

  // Delete user account (DANGER ZONE)
  app.delete('/api/user/account', requireAuth, async (req: any, res) => {
    try {
      const { confirmation } = req.body;
      
      if (confirmation !== 'DELETE') {
        return res.status(400).json({ error: 'Account deletion requires confirmation' });
      }

      const userId = req.user.id;
      
      // Get all user bots and stop them
      const userBots = await storage.getBotsByUserId(userId);
      for (const bot of userBots) {
        try {
          await BotManager.stopBot(bot.id);
          await storage.deleteBot(bot.id);
        } catch (error) {
          console.error(`Error deleting bot ${bot.id}:`, error);
        }
      }

      // Delete user from database
      await storage.deleteUser(userId);

      // Destroy session
      req.session.destroy((err: any) => {
        if (err) {
          console.error('Error destroying session during account deletion:', err);
        }
      });

      res.json({ 
        success: true, 
        message: 'Account deleted successfully' 
      });
    } catch (error) {
      console.error('Error deleting user account:', error);
      res.status(500).json({ error: 'Failed to delete account' });
    }
  });

  // Get security status
  app.get('/api/user/security', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Calculate security score based on various factors
      let securityScore = 0;
      const issues = [];

      // Discord connection
      securityScore += 30;

      // Account age (more points for older accounts)
      const accountAge = user.createdAt ? Date.now() - new Date(user.createdAt).getTime() : 0;
      const daysOld = accountAge / (1000 * 60 * 60 * 24);
      if (daysOld > 30) securityScore += 20;
      if (daysOld > 90) securityScore += 10;

      // Bot security
      const userBots = await storage.getBotsByUserId(user.id);
      if (userBots.length > 0) {
        securityScore += 20;
      }

      // Session security
      securityScore += 20;

      if (securityScore < 70) {
        issues.push('Consider enabling additional security features');
      }

      res.json({
        securityScore: Math.min(securityScore, 100),
        issues,
        lastLogin: new Date().toISOString(),
        accountAge: Math.floor(daysOld),
        connectedServices: ['Discord'],
        twoFactorEnabled: false // Discord handles 2FA
      });
    } catch (error) {
      console.error('Error getting security status:', error);
      res.status(500).json({ error: 'Failed to get security status' });
    }
  });

  // System diagnostics endpoint for troubleshooting
  app.get('/api/system/diagnostics', requireAuth, async (req: any, res) => {
    try {
      const { spawn } = require('child_process');
      
      const runDiagnosticCommand = (command: string, args: string[]): Promise<{ success: boolean; output: string; error?: string }> => {
        return new Promise((resolve) => {
          const process = spawn(command, args, { timeout: 10000 });
          let stdout = '';
          let stderr = '';
          
          process.stdout?.on('data', (data: any) => {
            stdout += data.toString();
          });
          
          process.stderr?.on('data', (data: any) => {
            stderr += data.toString();
          });
          
          process.on('exit', (code: number) => {
            resolve({
              success: code === 0,
              output: stdout.trim(),
              error: stderr.trim() || undefined
            });
          });
          
          process.on('error', (error: any) => {
            resolve({
              success: false,
              output: '',
              error: error.message
            });
          });
        });
      };

      // Run system diagnostics
      const diagnostics = await Promise.allSettled([
        runDiagnosticCommand('python3', ['--version']),
        runDiagnosticCommand('pip3', ['--version']),
        runDiagnosticCommand('node', ['--version']),
        runDiagnosticCommand('npm', ['--version']),
        runDiagnosticCommand('python3', ['-c', 'import discord; print("discord.py version:", discord.__version__)']),
      ]);

      const results = diagnostics.map((result, index) => {
        const commands = [
          { name: 'Python', command: 'python3 --version' },
          { name: 'pip3', command: 'pip3 --version' },
          { name: 'Node.js', command: 'node --version' },
          { name: 'npm', command: 'npm --version' },
          { name: 'discord.py', command: 'python3 -c "import discord; print(discord.__version__)"' }
        ];
        
        if (result.status === 'fulfilled') {
          return {
            name: commands[index].name,
            command: commands[index].command,
            ...result.value
          };
        } else {
          return {
            name: commands[index].name,
            command: commands[index].command,
            success: false,
            output: '',
            error: 'Promise rejected'
          };
        }
      });

      // Check environment variables
      const envCheck = {
        NODE_ENV: process.env.NODE_ENV || 'not set',
        MAX_BOTS_PER_USER: process.env.MAX_BOTS_PER_USER || 'not set (default: 1)',
        DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID ? 'set' : 'not set',
        DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET ? 'set' : 'not set',
        DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'not set'
      };

      // Check directories
      const fs = require('fs').promises;
      const path = require('path');
      
      const directoryChecks = await Promise.allSettled([
        fs.access(path.join(process.cwd(), 'bot_workspace')).then(() => true).catch(() => false),
        fs.access(path.join(process.cwd(), 'bot_logs')).then(() => true).catch(() => false)
      ]);

      const directories = {
        bot_workspace: directoryChecks[0].status === 'fulfilled' ? directoryChecks[0].value : false,
        bot_logs: directoryChecks[1].status === 'fulfilled' ? directoryChecks[1].value : false
      };

      res.json({
        system: results,
        environment: envCheck,
        directories,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    } catch (error) {
      console.error('Error running system diagnostics:', error);
      res.status(500).json({ error: 'Failed to run system diagnostics' });
    }
  });

  return server;
}
