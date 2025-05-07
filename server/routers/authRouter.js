// src/routes/auth.js
import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { query }  from '../database/connection.js';   // <-- one level up, into db.js

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Sign up a new user (default role: customer)
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  try {
    // Check for existing email
    const { rows: existing } = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (existing.length) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Hash and insert new user
    const hash = await bcrypt.hash(password, 10);
    await query(
      `INSERT INTO users (username, email, password)
       VALUES ($1, $2, $3)`,
      [username, email, hash]
    );

    // Send welcome email (optional)
    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome!',
      text: `Hello ${username}, welcome aboard!`,
    }).catch(err => console.error('Email error:', err));

    return res.status(201).json({ message: 'User created' });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Server error during signup' });
  }
});router.post('/login', async (req, res) => {
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

    // Sign the JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Return token + role
    return res.json({
      token,
      role: user.role
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error during login' });
  }
});


export default router;
