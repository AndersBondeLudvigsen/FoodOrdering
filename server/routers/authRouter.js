import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto'; 
import dayjs from 'dayjs';   


import { query }  from '../database/connection.js'; 

import { authenticate } from '../middleware/authenticate.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  try {
    const { rows: existing } = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (existing.length) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const hash = await bcrypt.hash(password, 10);
    await query(
      `INSERT INTO users (username, email, password)
       VALUES ($1, $2, $3)`,
      [username, email, hash]
    );

    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome!',
      text: `Hello ${username}, welcome aboard!`
    });

    return res.status(201).json({ message: 'User created' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error during signup' });
  }
});


router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Missing credentials' });
  }

  try {
    const { rows } = await query(
      'SELECT id, username, password, role FROM users WHERE email = $1',
      [email]
    );
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const user = rows[0];

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.send({
      token,
      role: user.role
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error during login' });
  }
});

router.patch('/change-password', authenticate, async (req, res) => {
    const userId      = req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Both passwords are required' });
    }

    try {
      const { rows } = await query(
        'SELECT password FROM users WHERE id = $1',
        [userId]
      );
      if (rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const valid = await bcrypt.compare(oldPassword, rows[0].password);
      if (!valid) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      await query(
        'UPDATE users SET password = $1 WHERE id = $2',
        [newHash, userId]
      );

      return res.send({ message: 'Password updated' });
    } catch (err) {
      return res.status(500).json({ message: 'Server error' });
    }
  }
);


router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const { rows } = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (rows.length === 0) {
      return res.send({ message: 'a password reset email has been sent.' });
    }

    const user = rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = dayjs().add(1, 'hour').toDate(); // Token valid for 1 hour

    await query(
      `UPDATE users
       SET reset_password_token = $1, reset_password_expires = $2
       WHERE id = $3`,
      [resetToken, resetExpires, user.id]
    );

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <p>You requested a password reset.</p>
        <p>Click this link to reset your password: <a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link is valid for 1 hour.</p>
      `,
    });

    return res.send({ message: 'If a user with that email exists, a password reset email has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Server error during password reset request' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and new password are required' });
  }

  try {
    const { rows } = await query(
      `SELECT id FROM users
       WHERE reset_password_token = $1 AND reset_password_expires > NOW()`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const userId = rows[0].id;
    const newHash = await bcrypt.hash(newPassword, 10);

    await query(
      `UPDATE users
       SET password = $1, reset_password_token = NULL, reset_password_expires = NULL
       WHERE id = $2`,
      [newHash, userId]
    );

    return res.send({ message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Server error during password reset' });
  }
});


export default router;
