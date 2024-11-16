const express = require('express');
require('dotenv').config();

const authRoutes = require('./routes/auth');

const app = express();
app.use(express.json());

// Routes
app.use('/auth', authRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ message: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
