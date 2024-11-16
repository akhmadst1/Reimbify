const express = require('express');
const {
    getUsers,
    register,
    login,
    verifyOtp,
    resendOtp,
    forgotPassword,
    resetPassword,
    changePassword,
    logout,
    deleteUser
} = require('../controllers/authController');

const router = express.Router();

router.get('/users', getUsers);
router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', changePassword);
router.post('/logout', logout);
router.post('/delete', deleteUser);

module.exports = router;
