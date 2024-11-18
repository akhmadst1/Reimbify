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
router.post('/otp/verify', verifyOtp);
router.post('/otp/resend', resendOtp);
router.post('/password/forgot', forgotPassword);
router.post('/password/reset', resetPassword);
router.post('/password/update', verifyToken, changePassword);
router.get('/users', verifyToken, getUsers);
router.delete('/delete', verifyToken, deleteUser);

module.exports = router;
