const bodyParser = require('body-parser')
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({extended: true}))
app.use(express.json());
app.use(cors({ origin: '*' }));

// Routes
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ message: 'An error occurred. Please try again later.' });
});

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
