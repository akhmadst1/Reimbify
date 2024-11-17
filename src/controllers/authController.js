const {
    createUser,
    verifyOtp,
    updateOtp,
    updatePassword,
    getAllUsers,
    findUserByEmail,
    findUserById,
    deleteUserById,
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
        const { email, password, name, department, role } = req.body;

        // Check if the email is already in use
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use.' });
        }

        // Generate a secure token with email and hashed password
        const hashedPassword = await bcrypt.hash(password, 10);
        const activationToken = jwt.sign(
            { email, hashedPassword, name, department, role },
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

        const { email, hashedPassword, name, department, role } = decoded;

        // Check if the user already exists (just in case)
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'Account already activated or email in use.' });
        }

        // Create the user in the database
        await createUser(email, hashedPassword, name, department, role);

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

        const isPasswordValid = await bcrypt.compare(password, user.password_hashed);
        if (!isPasswordValid) return res.status(400).json({ message: 'Invalid password' });

        // Generate and send OTP for verification
        const otp = generateOtp();
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // OTP valid for 5 minutes
        await updateOtp(user.id, otp, otpExpiresAt);
        await sendOtpEmail(email, otp);

        res.status(200).json({ message: 'OTP sent to email. Verify to complete login.', userId: user.id, email: email });
    } catch (error) {
        next(error);
    }
};

// Verify OTP and Issue Token
exports.verifyOtp = async (req, res, next) => {
    try {
        const { id, otp } = req.body;

        const isValid = await verifyOtp(id, otp);

        if (!isValid) return res.status(400).json({ message: 'Invalid or expired OTP' });

        // Immediately mark OTP as expired
        await updateOtp(id, null, null);

        // Generate short-lived access token
        const accessToken = generateAccessToken(id);

        res.status(200).json({ message: 'Login successful.', userId: id, accessToken });
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

        await updateOtp(user.id, newOtp, otpExpiresAt);
        await sendOtpEmail(email, newOtp);

        res.status(200).json({ message: 'OTP resent to email.', userId: user.id, email: email });
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

        await updateOtp(user.id, otp, otpExpiresAt);
        await sendOtpEmail(email, otp);

        res.status(200).json({ message: 'OTP for reset password sent to email.', userId: user.id, email: email });
    } catch (error) {
        next(error);
    }
};

// Reset Password
exports.resetPassword = async (req, res, next) => {
    try {
        const { id, otp, newPassword } = req.body;
        const isValid = await verifyOtp(id, otp);

        if (!isValid) return res.status(400).json({ message: 'Invalid or expired OTP' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await updatePassword(id, hashedPassword);

        // Immediately mark OTP as expired
        await updateOtp(id, null, null);

        res.status(200).json({ message: 'Password reset successfully.' });
    } catch (error) {
        next(error);
    }
};

// Change Password
exports.changePassword = async (req, res, next) => {
    try {
        const { id, oldPassword, newPassword } = req.body;
        const user = await findUserById(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isPasswordValid = await bcrypt.compare(oldPassword, user.password_hashed);
        if (!isPasswordValid) return res.status(400).json({ message: 'Invalid current password' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await updatePassword(id, hashedPassword);

        res.status(200).json({ message: 'Password changed successfully.'});
    } catch (error) {
        next(error);
    }
};

// Get Users (all or by ID/email)
exports.getUsers = async (req, res, next) => {
    try {
        const { email, id } = req.query;

        // Handle case: Get user by ID
        if (id) {
            const user = await findUserById(id);
            if (!user) {
                return res.status(404).json({ message: 'User not found by ID' });
            }
            return res.status(200).json({ user });
        }

        // Handle case: Get user by email
        if (email) {
            const user = await findUserByEmail(email);
            if (!user) {
                return res.status(404).json({ message: 'User not found by email' });
            }
            return res.status(200).json({ user });
        }

        // Handle case: No query params, return all users
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
        const { email, id } = req.body;

        if (!email && !id) {
            return res.status(400).json({ message: 'Please provide either email or id' });
        }

        let user;

        // Find user by ID if provided
        if (id) {
            user = await findUserById(id);
            if (!user) return res.status(404).json({ message: 'User not found by ID' });

            await deleteUserById(id);
        }

        // Find user by email if provided
        if (email) {
            user = await findUserByEmail(email);
            if (!user) return res.status(404).json({ message: 'User not found by email' });

            await deleteUserByEmail(email);
        }

        res.status(200).json({ message: 'User deleted successfully.', user });
    } catch (error) {
        next(error);
    }
};
