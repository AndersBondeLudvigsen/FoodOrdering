import { rateLimit } from 'express-rate-limit';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000, //set to 200 for prod
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    message: "Too many requests from this IP, please try again after 15 minutes."
  }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10000, //Note to self: Change this for production to 10
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    message: "Too many authentication attempts from this IP, please try again after 15 minutes."
  }
});