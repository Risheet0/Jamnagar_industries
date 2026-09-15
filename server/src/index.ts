import express from 'express';
import cors from 'cors';
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

// Ensure prisma dir exists for sessions.db
const prismaDir = path.resolve(__dirname, '../prisma');
if (!fs.existsSync(prismaDir)) {
  fs.mkdirSync(prismaDir, { recursive: true });
}

// Session store
const SQLiteStore = connectSqlite3(session);

app.use(
  cors({
    origin: true, // Allow frontend dev server and LAN workstations
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
      secure: false, // LAN HTTP deployment
      httpOnly: true,
      maxAge: 12 * 60 * 60 * 1000 // 12 hours (standard industrial floor shift)
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
