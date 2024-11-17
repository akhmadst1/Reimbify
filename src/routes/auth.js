const express = require('express');
const {
    register,
    activateAccount,
    login,
    verifyOtp,
    resendOtp,
    forgotPassword,
    resetPassword,
    changePassword,
    getUsers,
    deleteUser
} = require('../controllers/authController');

const { verifyToken } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/register', register);
router.get('/activate', activateAccount);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', verifyToken, changePassword);
router.get('/users', getUsers);
router.post('/delete', verifyToken, deleteUser);

module.exports = router;
