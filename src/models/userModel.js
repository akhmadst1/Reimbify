const pool = require('../config/pool'); // Import Cloud SQL connection pool

// Create a new user in the database
exports.createUser = async (email, passwordHashed, name, department, role = 'user') => {
    // Generate a random 6-digit ID
    const randomId = Math.floor(100000 + Math.random() * 900000);

    // SQL query to insert the new user
    const query = `
        INSERT INTO users (id, email, password_hashed, name, department, role)
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
exports.findUserById = async (id) => {
    const query = `
        SELECT * FROM users WHERE id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0];
};

// Update the OTP code and expiry time for a user
exports.updateOtp = async (id, otp, otpExpiresAt) => {
    const query = `
        UPDATE users 
        SET otp_code = ?, otp_expires_at = ? 
        WHERE id = ?
    `;
    await pool.query(query, [otp, otpExpiresAt, id]);
};

// Verify the OTP code for a user
exports.verifyOtp = async (id, otp) => {
    const query = `
        SELECT * FROM users 
        WHERE id = ? AND otp_code = ? AND otp_expires_at > NOW()
    `;
    const [rows] = await pool.query(query, [id, otp]);
    return rows.length > 0;
};

// Update the password for a user
exports.updatePassword = async (id, passwordHashed) => {
    const query = `
        UPDATE users 
        SET password_hashed = ? 
        WHERE id = ?
    `;
    await pool.query(query, [passwordHashed, id]);
};

// Update user name
exports.updateName = async (id, name) => {
    const query = `
        UPDATE users 
        SET name = ? 
        WHERE id = ?
    `;
    await pool.query(query, [name, id]);
};

// Update user department
exports.updateDepartment = async (id, department) => {
    const query = `
        UPDATE users 
        SET department = ? 
        WHERE id = ?
    `;
    await pool.query(query, [department, id]);
};

// Update user role
exports.updateRole = async (id, role) => {
    const query = `
        UPDATE users 
        SET role = ? 
        WHERE id = ?
    `;
    await pool.query(query, [role, id]);
};

// Update user profile
exports.updateProfileImage = async (id, profileImageUrl) => {
    const query = `
        UPDATE users 
        SET profile_image_url = ? 
        WHERE id = ?
    `;
    await pool.query(query, [role, profileImageUrl, id]);
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

// Delete a user by id
exports.deleteUserById = async (id) => {
    const query = `
        DELETE FROM users 
        WHERE id = ?
    `;
    await pool.query(query, [id]);
};

// Delete a user by email
exports.deleteUserByEmail = async (email) => {
    const query = `
        DELETE FROM users 
        WHERE email = ?
    `;
    await pool.query(query, [email]);
};
