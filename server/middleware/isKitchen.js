export function isKitchen(req, res, next) {
    if (req.user.role !== 'kitchen') {
      return res.status(403).json({ message: 'Forbidden: kitchen only' });
    }
    next();
  }
  