// Load environment variables FIRST before any other imports
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try multiple paths for .env file to work in both dev and production
const envPaths = [
  join(__dirname, '..', '.env'),  // Development path
  join(process.cwd(), '.env'),    // Production path (current working directory)
  '.env'                          // Fallback
];

for (const envPath of envPaths) {
  try {
    dotenv.config({ path: envPath });
    console.log(`Loaded environment from: ${envPath}`);
    break;
  } catch (error) {
    // Continue to next path
  }
}

// Fix SSL certificate issues in production early
if (process.env.NODE_ENV === 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not found in environment variables');
  process.exit(1);
}

// Now import everything else
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import { neon } from "@neondatabase/serverless";
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";

const app = express();

// Configure trust proxy for production deployment - restrict to known proxy hops
// This prevents IP spoofing while allowing rate limiting to work properly
const trustProxyHops = parseInt(process.env.TRUST_PROXY_HOPS || '1', 10);
app.set('trust proxy', trustProxyHops);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://cdn.discordapp.com", "https://cdnjs.cloudflare.com"],
      connectSrc: ["'self'", "wss:", "ws:", "https://cdnjs.cloudflare.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Enhanced DDoS protection with advanced rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  // Enhanced security for trust proxy usage
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  },
  // Use X-Forwarded-For header when behind proxy
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  // Sliding window counter store for better DDoS protection
  store: undefined, // Use default memory store for now, can be upgraded to Redis later
});

app.use('/api', limiter);

// Stricter rate limiting for bot operations
const botLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 10, // limit each IP to 10 bot operations per minute
  message: 'Too many bot operations, please try again later.',
});

app.use('/api/bots', botLimiter);

// Enable CORS with production-ready settings
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.APP_URL ? [process.env.APP_URL] : true)
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Session configuration
const PgSession = ConnectPgSimple(session);

// Create Neon connection for sessions
const sql = neon(process.env.DATABASE_URL!);

app.use(session({
  store: new PgSession({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    tableName: 'session',
    // Add pruning of expired sessions
    pruneSessionInterval: 60 // Prune expired sessions every 60 seconds
  }),
  secret: process.env.SESSION_SECRET || (process.env.NODE_ENV === 'production' ? 
    (function() { throw new Error('SESSION_SECRET must be set in production'); })() : 
    'dev-session-secret-key-here'),
  resave: false,
  saveUninitialized: false,
  name: 'delta.sid', // Custom name to avoid default 'connect.sid'
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Secure in production
    httpOnly: true,
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '2592000000'), // Default 30 days
    sameSite: 'lax', // Allow cookies across same-site requests
    path: '/',
    domain: process.env.COOKIE_DOMAIN || undefined // Set domain in production
  },
  // Additional security options
  rolling: true, // Reset expiration on each request
  unset: 'destroy' // Remove session from store when unset
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Import required modules for HTTPS support
  let server;
  
  // Check if HTTPS is enabled
  if (process.env.ENABLE_HTTPS === 'true') {
    // Import fs and https modules for HTTPS support
    const fs = await import('fs');
    const https = await import('https');
    
    // Check for required HTTPS configuration
    const keyPath = process.env.HTTPS_KEY_PATH;
    const certPath = process.env.HTTPS_CERT_PATH;
    
    if (!keyPath || !certPath) {
      console.error('HTTPS_KEY_PATH and HTTPS_CERT_PATH must be set when ENABLE_HTTPS is true');
      process.exit(1);
    }
    
    try {
      // Read SSL certificate and key
      const privateKey = fs.readFileSync(keyPath, 'utf8');
      const certificate = fs.readFileSync(certPath, 'utf8');
      
      const credentials = { key: privateKey, cert: certificate };
      
      // Create HTTPS server
      const httpsServer = https.createServer(credentials, app);
      server = await registerRoutes(app, httpsServer);
      
      console.log('HTTPS server created successfully');
    } catch (error) {
      console.error('Failed to create HTTPS server:', error);
      process.exit(1);
    }
  } else {
    // Create regular HTTP server
    server = await registerRoutes(app);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    const protocol = process.env.ENABLE_HTTPS === 'true' ? 'HTTPS' : 'HTTP';
    log(`${protocol} server serving on port ${port}`);
    log(`OAuth2 redirect URI: ${process.env.APP_URL}/api/auth/callback`);
  });
})();
