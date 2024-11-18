const pool = require('../config/pool'); // Import Cloud SQL connection pool

// Create a new user in the database
exports.createUser = async (email, passwordHashed, name, department, role = 'user') => {
    // Generate a random 6-digit ID
    const randomId = Math.floor(100000 + Math.random() * 900000);

    // SQL query to insert the new user
    const query = `
        INSERT INTO users (user_id, email, password_hashed, name, department, role)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    try {
        await pool.query(query, [randomId, email, passwordHashed, name, department, role]);
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            // Handle duplicate ID collision by retrying with a new ID
            console.error('Duplicate ID detected. Retrying...');
            return await exports.createUser(email, passwordHashed, name, department, role); // Recursive retry
        }
        throw err; // Rethrow any other errors
    }
};

// Find a user by email
exports.findUserByEmail = async (email) => {
    const query = `
        SELECT * FROM users WHERE email = ?
    `;
    const [rows] = await pool.query(query, [email]);
    return rows[0];
};

// Find a user by ID
exports.findUserById = async (userId) => {
    const query = `
        SELECT * FROM users WHERE user_id = ?
    `;
    const [rows] = await pool.query(query, [userId]);
    return rows[0];
};

// Update the OTP code and expiry time for a user
exports.updateOtp = async (userId, otp, otpExpiresAt) => {
    const query = `
        UPDATE users 
        SET otp_code = ?, otp_expires_at = ? 
        WHERE user_id = ?
    `;
    await pool.query(query, [otp, otpExpiresAt, userId]);
};

// Verify the OTP code for a user
exports.verifyOtp = async (userId, otp) => {
    const query = `
        SELECT * FROM users 
        WHERE user_id = ? AND otp_code = ? AND otp_expires_at > NOW()
    `;
    const [rows] = await pool.query(query, [userId, otp]);
    return rows.length > 0;
};

// Update the password for a user
exports.updatePassword = async (userId, passwordHashed) => {
    const query = `
        UPDATE users 
        SET password_hashed = ? 
        WHERE user_id = ?
    `;
    await pool.query(query, [passwordHashed, userId]);
};

// Update user name
exports.updateName = async (userId, name) => {
    const query = `
        UPDATE users 
        SET name = ? 
        WHERE user_id = ?
    `;
    await pool.query(query, [name, userId]);
};

// Update user department
exports.updateDepartment = async (userId, department) => {
    const query = `
        UPDATE users 
        SET department = ? 
        WHERE user_id = ?
    `;
    await pool.query(query, [department, userId]);
};

// Update user role
exports.updateRole = async (userId, role) => {
    const query = `
        UPDATE users 
        SET role = ? 
        WHERE user_id = ?
    `;
    await pool.query(query, [role, userId]);
};

// Update user profile
exports.updateProfileImage = async (userId, profileImageUrl) => {
    const query = `
        UPDATE users 
        SET profile_image_url = ? 
        WHERE user_id = ?
    `;
    await pool.query(query, [profileImageUrl, userId]);
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

// Delete a user by userId
exports.deleteUserById = async (userId) => {
    const query = `
        DELETE FROM users 
        WHERE user_id = ?
    `;
    await pool.query(query, [userId]);
};

// Delete a user by email
exports.deleteUserByEmail = async (email) => {
    const query = `
        DELETE FROM users 
        WHERE email = ?
    `;
    await pool.query(query, [email]);
};
