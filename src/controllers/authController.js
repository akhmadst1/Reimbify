const {
    getAllUsers,
    createUser,
    verifyOtp,
    findUserByEmail,
    updateOtp,
    updatePassword,
    deleteUserByEmail,
} = require('../models/userModel');
const { sendActivationEmail, sendOtpEmail } = require('../utils/emailService');
const { generateOtp } = require('../utils/otpUtil');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// JWT Helpers
const generateAccessToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1d' });

// Register
exports.register = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Check if the email is already in use
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use.' });
        }

        // Generate a secure token with email and hashed password
        const hashedPassword = await bcrypt.hash(password, 10);
        const activationToken = jwt.sign(
            { email, hashedPassword },
            process.env.JWT_SECRET,
            { expiresIn: '24h' } // Token valid for 24 hours
        );

        const activationLink = `${process.env.BACKEND_URL}/auth/activate?token=${activationToken}`;

        // Send activation email
        await sendActivationEmail(email, activationLink);

        res.status(200).json({ message: 'Activation email sent. Please check your inbox.' });
    } catch (error) {
        next(error);
    }
};

// Activate Account After Registration
exports.activateAccount = async (req, res, next) => {
    try {
        const { token } = req.query;

        // Verify and decode the JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const { email, hashedPassword } = decoded;

        // Check if the user already exists (just in case)
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'Account already activated or email in use.' });
        }

        // Create the user in the database
        await createUser(email, hashedPassword);

        res.status(201).json({ message: 'Account activated successfully.' });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(400).json({ message: 'Activation link expired. Please register again.' });
        }
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
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await updateOtp(email, otp, otpExpiresAt);
        await sendOtpEmail(email, otp);

        res.status(200).json({ message: 'OTP for reset password sent to email.' });
    } catch (error) {
        next(error);
    }
};

// Reset Password
exports.resetPassword = async (req, res, next) => {
    try {
        const { email, otp, newPassword } = req.body;
        const isValid = await verifyOtp(email, otp);

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

// Get List of Users
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

// Delete User
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
