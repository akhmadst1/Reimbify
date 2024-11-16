const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendOtpEmail } = require('../utils/emailService');
const {
    getAllUsers,
    createUser,
    verifyOtp,
    findUserByEmail,
    updateOtp,
    updatePassword,
    deleteUserByEmail,
    markUserAsVerified
} = require('../models/userModel');
const { generateOtp, validateOtp } = require('../utils/otpUtil');
require('dotenv').config();

// JWT Helpers
const generateAccessToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });

// Get Users
exports.getUsers = async (req, res, next) => {
    try {
        const users = await getAllUsers();

        if (users.length === 0) {
            return res.status(404).json({ message: 'No users found' });
        }

        res.status(200).json({ users });
    } catch (error) {
        next(error);
    }
};

// Register
exports.register = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const existingUser = await findUserByEmail(email);
        if (existingUser) return res.status(400).json({ message: 'Email already in use' });

        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user without sending OTP
        await createUser(email, hashedPassword);

        res.status(201).json({ message: 'User registered successfully.' });
    } catch (error) {
        next(error);
    }
};

// Login
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await findUserByEmail(email);

        if (!user) return res.status(404).json({ message: 'User not found' });

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) return res.status(400).json({ message: 'Invalid password' });

        // Generate and send OTP for verification
        const otp = generateOtp();
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // OTP valid for 5 minutes
        await updateOtp(email, otp, otpExpiresAt);
        await sendOtpEmail(email, otp);

        res.status(200).json({ message: 'OTP sent to email. Verify to complete login.' });
    } catch (error) {
        next(error);
    }
};

// Verify OTP and Issue Token
exports.verifyOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        const isValid = await verifyOtp(email, otp);

        if (!isValid) return res.status(400).json({ message: 'Invalid or expired OTP' });

        // Immediately mark OTP as expired
        await updateOtp(email, null, null);

        // Generate short-lived access token
        const user = await findUserByEmail(email);
        const accessToken = generateAccessToken(user.id);

        res.status(200).json({ message: 'Login successful.', accessToken });
    } catch (error) {
        next(error);
    }
};

// Resend OTP
exports.resendOtp = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await findUserByEmail(email);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const newOtp = generateOtp();
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await updateOtp(email, newOtp, otpExpiresAt);
        await sendOtpEmail(email, newOtp);

        res.status(200).json({ message: 'OTP resent to email.' });
    } catch (error) {
        next(error);
    }
};

// Forgot Password
exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await findUserByEmail(email);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const otp = generateOtp();
        await updateOtp(email, otp);
        await sendOtpEmail(email, otp);

        res.status(200).json({ message: 'OTP sent for password reset.' });
    } catch (error) {
        next(error);
    }
};

// Reset Password
exports.resetPassword = async (req, res, next) => {
    try {
        const { email, otp, newPassword } = req.body;
        const isValid = await validateOtp(email, otp);

        if (!isValid) return res.status(400).json({ message: 'Invalid or expired OTP' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await updatePassword(email, hashedPassword);

        res.status(200).json({ message: 'Password reset successfully.', user });
    } catch (error) {
        next(error);
    }
};

// Change Password
exports.changePassword = async (req, res, next) => {
    try {
        const { email, oldPassword, newPassword } = req.body;
        const user = await findUserByEmail(email);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordValid) return res.status(400).json({ message: 'Invalid current password' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await updatePassword(email, hashedPassword);

        res.status(200).json({ message: 'Password changed successfully.', user });
    } catch (error) {
        next(error);
    }
};

// Logout
exports.logout = async (req, res, next) => {
    try {
        // Client-side token removal
        res.status(200).json({ message: 'Logged out successfully.' });
    } catch (error) {
        next(error);
    }
};

exports.deleteUser = async (req, res, next) => {
    try {
        const { email } = req.body;

        const user = await findUserByEmail(email);
        if (!user) return res.status(404).json({ message: 'User not found' });

        await deleteUserByEmail(email);

        res.status(200).json({ message: 'User deleted successfully.', user });
    } catch (error) {
        next(error);
    }
};