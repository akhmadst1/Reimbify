const {
    createUser,
    verifyOtp,
    updateOtp,
    updatePassword,
    getUsers,
    deleteUserById,
    deleteUserByEmail,
    getHashedPassword
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
        const { email, password, userName, departmentId, role } = req.body;

        // Check if the email is already in use
        const existingUserArray = await getUsers({ email });
        if (existingUserArray.length === 0) {
            return res.status(400).json({ message: 'Email already in use.' });
        }

        // Default role is 'user'
        const defaultRole = role || 'user';

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate activation token
        const activationToken = jwt.sign(
            { email, hashedPassword, userName, departmentId, defaultRole },
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

        const { email, hashedPassword, userName, departmentId, defaultRole } = decoded;

        // Check if the user already exists (just in case)
        const existingUserArray = await getUsers({ email });
        if (existingUserArray.length === 0) {
            return res.status(400).json({ message: 'Account already activated or email in use.' });
        }

        // Create the user in the database
        await createUser(email, hashedPassword, userName, departmentId, defaultRole);

        res.status(201).json({ message: 'Account activated successfully.' });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(400).json({ message: 'Activation link expired. Please register again.' });
        }
        next(error);
    }
};

// Login with OTP
exports.loginOTP = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const userArray = await getUsers({ email });
        if (userArray.length === 0) return res.status(404).json({ message: 'User not found' });
        const user = userArray[0];

        const userPassword = await getHashedPassword(user.userId);

        const isPasswordValid = await bcrypt.compare(password, userPassword);
        if (!isPasswordValid) return res.status(400).json({ message: 'Invalid password' });

        // Generate and send OTP for verification
        const otp = generateOtp();
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // OTP valid for 5 minutes
        await updateOtp(user.userId, otp, otpExpiresAt);
        await sendOtpEmail(email, otp);

        res.status(200).json({ message: 'OTP sent to email. Verify to complete login.', userId: user.userId, email });
    } catch (error) {
        next(error);
    }
};

// Login without OTP
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const userArray = await getUsers({ email });
        if (userArray.length === 0) return res.status(404).json({ message: 'User not found' });
        const user = userArray[0];

        const userPassword = await getHashedPassword(user.userId);

        const isPasswordValid = await bcrypt.compare(password, userPassword);
        if (!isPasswordValid) return res.status(400).json({ message: 'Invalid password' });

        // Generate short-lived access token
        const accessToken = generateAccessToken(user.userId);

        res.status(200).json({ message: 'Login successful.', userId: user.userId, role: user.role, accessToken });
    } catch (error) {
        next(error);
    }
};

// Verify OTP and Issue Token
exports.verifyOtp = async (req, res, next) => {
    try {
        const { userId, otp } = req.body;
        const userArray = await getUsers({ userId });
        if (userArray.length === 0) return res.status(404).json({ message: 'User not found' });
        const user = userArray[0];

        const isValid = await verifyOtp(userId, otp);

        if (!isValid) return res.status(400).json({ message: 'Invalid or expired OTP' });

        // Immediately mark OTP as expired
        await updateOtp(userId, null, null);

        // Generate short-lived access token
        const accessToken = generateAccessToken(userId);

        res.status(200).json({ message: 'Login successful.', userId: userId, role: user.role, accessToken });
    } catch (error) {
        next(error);
    }
};

// Resend OTP
exports.resendOtp = async (req, res, next) => {
    try {
        const { userId } = req.body;
        const userArray = await getUsers({ userId });
        if (userArray.length === 0) return res.status(404).json({ message: 'User not found' });
        const user = userArray[0];

        const newOtp = generateOtp();
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await updateOtp(user.userId, newOtp, otpExpiresAt);
        await sendOtpEmail(user.email, newOtp);

        res.status(200).json({ message: 'OTP resent to email.', userId: user.userId, email: user.email });
    } catch (error) {
        next(error);
    }
};

// Forgot Password
exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const userArray = await getUsers({ email });
        if (userArray.length === 0) return res.status(404).json({ message: 'User not found' });
        const user = userArray[0];

        const otp = generateOtp();
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await updateOtp(user.userId, otp, otpExpiresAt);
        await sendOtpEmail(email, otp);

        res.status(200).json({ message: 'OTP for reset password sent to email.', userId: user.userId, email });
    } catch (error) {
        next(error);
    }
};

// Reset Password
exports.resetPassword = async (req, res, next) => {
    try {
        const { userId, newPassword } = req.body;
        const userArray = await getUsers({ userId });
        if (userArray.length === 0) return res.status(404).json({ message: 'User not found' });
        const user = userArray[0];

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await updatePassword(userId, hashedPassword);

        res.status(200).json({ message: 'Password reset successfully.', userId: userId, email: user.email, role: user.role });
    } catch (error) {
        next(error);
    }
};

// Change Password
exports.changePassword = async (req, res, next) => {
    try {
        const { userId, oldPassword, newPassword } = req.body;
        const userArray = await getUsers({ userId });
        if (userArray.length === 0) return res.status(404).json({ message: 'User not found' });
        const user = userArray[0];

        const userPassword = await getHashedPassword(user.userId);

        const isPasswordValid = await bcrypt.compare(oldPassword, userPassword);
        if (!isPasswordValid) return res.status(400).json({ message: 'Invalid current password' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await updatePassword(userId, hashedPassword);

        res.status(200).json({ message: 'Password changed successfully.' });
    } catch (error) {
        next(error);
    }
};

// Get Users (all or by ID/email)
exports.getUsers = async (req, res, next) => {
    try {
        const { email, userId, departmentId, search, sorted, role } = req.query;

        const users = await getUsers({ email, userId, departmentId, search, sorted, role });
        if (!users || users.length === 0) {
            return res.status(404).json({ message: 'No users found' });
        }
        return res.status(200).json({ users });
    } catch (error) {
        next(error);
    }
};

// Delete User
exports.deleteUser = async (req, res, next) => {
    try {
        const { email, userId } = req.query;

        if (!email && !userId) {
            return res.status(400).json({ message: 'Please provide either email or user id' });
        }

        let user;

        // Find user by ID if provided
        if (userId) {
            const userArray = await getUsers({ userId });
            if (userArray.length === 0) return res.status(404).json({ message: 'User not found by ID' });
            user = userArray[0];

            await deleteUserById(userId);
        }

        // Find user by email if provided
        if (email) {
            const userArray = await getUsers({ email });
            if (userArray.length === 0) return res.status(404).json({ message: 'User not found by email' });
            user = userArray[0];

            await deleteUserByEmail(email);
        }

        res.status(200).json({ message: 'User deleted successfully.', user });
    } catch (error) {
        next(error);
    }
};
