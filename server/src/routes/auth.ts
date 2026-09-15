import { Router } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../db';
import { loginSchema, changePasswordSchema } from '../validation';
import { requireAuth } from '../middleware/auth';

export const authRouter = Router();

// POST /api/auth/login
authRouter.post('/login', async (req, res, next) => {
  try {
    const { username, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;
    req.session.mustChangePassword = user.mustChangePassword;

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        mustChangePassword: user.mustChangePassword
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
authRouter.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout session' });
    }
    res.clearCookie('connect.sid');
    return res.json({ success: true, message: 'Logged out successfully' });
  });
});

// GET /api/auth/me
authRouter.get('/me', async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.json({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: {
        id: true,
        username: true,
        role: true,
        mustChangePassword: true,
        createdAt: true
      }
    });

    return res.json({ user });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/change-password
authRouter.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.session.userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        mustChangePassword: false
      }
    });

    req.session.mustChangePassword = false;

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
});
