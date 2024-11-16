const pool = require('../config/pool'); // Import Cloud SQL connection pool

// Create a new user in the database
exports.createUser = async (email, passwordHashed, role='user') => {
    const query = `
        INSERT INTO users (email, password_hashed, role)
        VALUES (?, ?, ?)
    `;
    await pool.query(query, [email, passwordHashed, role]);
};

// Find a user by email
exports.findUserByEmail = async (email) => {
    const query = `
        SELECT * FROM users WHERE email = ?
    `;
    const [rows] = await pool.query(query, [email]);
    return rows[0];
};

// Update the OTP code and expiry time for a user
exports.updateOtp = async (email, otp, otpExpiresAt) => {
    const query = `
        UPDATE users 
        SET otp_code = ?, otp_expires_at = ? 
        WHERE email = ?
    `;
    await pool.query(query, [otp, otpExpiresAt, email]);
};

// Verify the OTP code for a user
exports.verifyOtp = async (email, otp) => {
    const query = `
        SELECT * FROM users 
        WHERE email = ? AND otp_code = ? AND otp_expires_at > NOW()
    `;
    const [rows] = await pool.query(query, [email, otp]);
    return rows.length > 0;
};

// Update the password for a user
exports.updatePassword = async (email, passwordHashed) => {
    const query = `
        UPDATE users 
        SET password_hashed = ? 
        WHERE email = ?
    `;
    await pool.query(query, [passwordHashed, email]);
};

// Delete a user by email
exports.deleteUserByEmail = async (email) => {
    const query = `
        DELETE FROM users 
        WHERE email = ?
    `;
    await pool.query(query, [email]);
};

// Fetch all users from the database
exports.getAllUsers = async () => {
    const query = `
        SELECT *
        FROM users
    `;
    const [rows] = await pool.query(query);
    return rows;
};