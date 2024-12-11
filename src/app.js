const bodyParser = require('body-parser')
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const bankAccountRoutes = require('./routes/bankAccount');
const departmentRoutes = require('./routes/department');
const bankRoutes = require('./routes/bank');
const receiptRoutes = require('./routes/receipt');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.json());
app.use(cors({ origin: '*' }));

// Base URL
app.get('/', (req, res) => {
    res.send('Hello! Welcome to our API. Use the specific endpoints to interact with the system.');
});

// Routes
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/bank-account', bankAccountRoutes);
app.use('/department', departmentRoutes);
app.use('/bank', bankRoutes);
app.use('/request', receiptRoutes);

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
