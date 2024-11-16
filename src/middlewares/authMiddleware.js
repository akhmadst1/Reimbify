const jwt = require('jsonwebtoken');

// Middleware to Protect Routes
exports.authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Token expired or invalid. Please login again.' });
        req.user = user;
        next();
    });
};
