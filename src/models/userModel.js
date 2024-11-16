const pool = require('../config/pool'); // Import Cloud SQL connection pool

exports.createUser = async (email, passwordHash) => {
    const query = `
        INSERT INTO users (email, password_hash)
        VALUES (?, ?)
    `;
    await pool.query(query, [email, passwordHash]);
};

exports.findUserByEmail = async (email) => {
    const query = `
        SELECT * FROM users WHERE email = ?
    `;
    const [rows] = await pool.query(query, [email]);
    return rows[0];
};

exports.updateOtp = async (email, otp, otpExpiresAt) => {
    const query = `
        UPDATE users 
        SET otp_code = ?, otp_expires_at = ? 
        WHERE email = ?
    `;
    await pool.query(query, [otp, otpExpiresAt, email]);
};

exports.verifyOtp = async (email, otp) => {
    const query = `
        SELECT * FROM users 
        WHERE email = ? AND otp_code = ? AND otp_expires_at > NOW()
    `;
    console.log('test');
    const [rows] = await pool.query(query, [email, otp]);
    return rows.length > 0;
};

exports.markUserAsVerified = async (email) => {
    const query = `
        UPDATE users 
        SET is_verified = TRUE 
        WHERE email = ?
    `;
    await pool.query(query, [email]);
};

exports.updatePassword = async (email, passwordHash) => {
    const query = `
        UPDATE users 
        SET password_hash = ? 
        WHERE email = ?
    `;
    await pool.query(query, [passwordHash, email]);
};

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