const {
    createUser,
    verifyOtp,
    updateOtp,
    updatePassword,
    getAllUsers,
    getUsersByDepartmentId,
    findUserByEmail,
    findUserById,
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

        const defaultRole = role || 'user'; // Default role is 'user'

        // Check if the email is already in use
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use.' });
        }

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
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
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

// Login
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await findUserByEmail(email);

        if (!user) return res.status(404).json({ message: 'User not found' });

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

// Verify OTP and Issue Token
exports.verifyOtp = async (req, res, next) => {
    try {
        const { userId, otp } = req.body;

        const isValid = await verifyOtp(userId, otp);

        if (!isValid) return res.status(400).json({ message: 'Invalid or expired OTP' });

        // Immediately mark OTP as expired
        await updateOtp(userId, null, null);

        // Generate short-lived access token
        const accessToken = generateAccessToken(userId);

        res.status(200).json({ message: 'Login successful.', userId: userId, accessToken });
    } catch (error) {
        next(error);
    }
};

// Resend OTP
exports.resendOtp = async (req, res, next) => {
    try {
        const { userId } = req.body;
        const user = await findUserById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

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
        const user = await findUserByEmail(email);
        if (!user) return res.status(404).json({ message: 'User not found' });

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
        const { userId, otp, newPassword } = req.body;
        const isValid = await verifyOtp(userId, otp);

        if (!isValid) return res.status(400).json({ message: 'Invalid or expired OTP' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await updatePassword(userId, hashedPassword);

        // Immediately mark OTP as expired
        await updateOtp(userId, null, null);

        res.status(200).json({ message: 'Password reset successfully.' });
    } catch (error) {
        next(error);
    }
};

// Change Password
exports.changePassword = async (req, res, next) => {
    try {
        const { userId, oldPassword, newPassword } = req.body;
        const user = await findUserById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

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
        const { email, userId, departmentId } = req.query;

        // Get user by ID
        if (userId) {
            const user = await findUserById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found by ID' });
            }
            return res.status(200).json({ user });
        }

        // Get user by email
        if (email) {
            const user = await findUserByEmail(email);
            if (!user) {
                return res.status(404).json({ message: 'User not found by email' });
            }
            return res.status(200).json({ user });
        }

        // Get users by department ID
        if (departmentId) {
            const users = await getUsersByDepartmentId(departmentId);
            if (users.length === 0) {
                return res.status(404).json({ message: 'No users found for this department' });
            }
            return res.status(200).json({ users });
        }

        // Get all users if no query parameters provided
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
        const { email, userId } = req.query;

        if (!email && !userId) {
            return res.status(400).json({ message: 'Please provide either email or user id' });
        }

        let user;

        // Find user by ID if provided
        if (userId) {
            user = await findUserById(userId);
            if (!user) return res.status(404).json({ message: 'User not found by ID' });

            await deleteUserById(userId);
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
