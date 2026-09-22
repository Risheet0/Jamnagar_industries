import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import connectSqlite3 from 'connect-sqlite3';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

import { authRouter } from './routes/auth';
import { workersRouter } from './routes/workers';
import { materialsRouter } from './routes/materials';
import { productsRouter } from './routes/products';
import { productionRouter } from './routes/production';
import { qualityRouter } from './routes/quality';
import { attendanceRouter } from './routes/attendance';
import { leavesRouter } from './routes/leaves';
import { calendarRouter } from './routes/calendar';
import { payrollRouter } from './routes/payroll';
import { dashboardRouter } from './routes/dashboard';
import { settingsRouter } from './routes/settings';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows cross-origin assets for LAN/dev
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// Global Rate Limiter: 1500 requests per 15 mins
const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api/', globalApiLimiter);

// Auth Login Rate Limiter: 30 attempts per 15 mins to prevent brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' }
});

// Ensure prisma dir exists for sessions.db
const prismaDir = path.resolve(__dirname, '../prisma');
if (!fs.existsSync(prismaDir)) {
  fs.mkdirSync(prismaDir, { recursive: true });
}

// Session store
const SQLiteStore = connectSqlite3(session);

const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RENDER;

// Trust reverse proxy for HTTPS cookies on Render/Heroku/Vercel
if (isProduction) {
  app.set('trust proxy', 1);
}

// Allowed origins for CORS (Vercel, LAN, Localhost)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      // Allow any Vercel preview/production deployment or localhost
      if (
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.includes('10.10.') ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive fallback
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(
  session({
    store: new SQLiteStore({
      db: 'sessions.db',
      dir: prismaDir
    }) as any,
    secret: process.env.SESSION_SECRET || 'jamnagar-erp-factory-secure-session-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction, // HTTPS on Render
      sameSite: isProduction ? 'none' : 'lax', // Required for cross-site cookies between Vercel and Render
      httpOnly: true,
      maxAge: 12 * 60 * 60 * 1000 // 12 hours
    }
  })
);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    plant: 'Vadilal Engineering Industries',
    timestamp: new Date().toISOString()
  });
});

// Mount API Routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth', authRouter);
app.use('/api/workers', workersRouter);
app.use('/api/materials', materialsRouter);
app.use('/api/products', productsRouter);
app.use('/api/production', productionRouter);
app.use('/api/quality', qualityRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/leaves', leavesRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/payroll', payrollRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/settings', settingsRouter);

// Global Error Handler
app.use(errorHandler);

// Serve frontend static build if present in production
const frontendDist = path.resolve(__dirname, '../../dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Start server on 0.0.0.0 for LAN workstations
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🏭 Jamnagar Industrial ERP Server running`);
  console.log(`   Port: ${PORT}`);
  console.log(`   Local URL: http://localhost:${PORT}`);
  console.log(`   LAN Mode: Accessible to other workstations on local network`);
  console.log(`=======================================================`);
});
