const pool = require('../config/pool'); // Import Cloud SQL connection pool

// Create a new user in the database
exports.createUser = async (email, passwordHashed, name, departmentId, role = 'user') => {
    // Generate a random 6-digit ID
    const randomId = Math.floor(100000 + Math.random() * 900000);

    // SQL query to insert the new user
    const query = `
        INSERT INTO user (user_id, email, password_hashed, name, department_id, role)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    try {
        await pool.query(query, [randomId, email, passwordHashed, name, departmentId, role]);
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            // Handle duplicate ID collision by retrying with a new ID
            console.error('Duplicate ID detected. Retrying...');
            return await exports.createUser(email, passwordHashed, name, departmentId, role); // Recursive retry
        }
        throw err; // Rethrow any other errors
    }
};

exports.findUserByEmail = async (email) => {
    const query = `
        SELECT 
            user.user_id,
            user.email,
            user.name,
            department.department_id,
            department.department_name,
            user.role,
            user.profile_image_url
        FROM 
            user
        JOIN 
            department ON user.department_id = department.department_id
        WHERE 
            user.email = ?
    `;
    const [rows] = await pool.query(query, [email]);
    if (rows.length === 0) return null;

    const user = rows[0];
    return {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        department: {
            department_id: user.department_id,
            department_name: user.department_name
        },
        role: user.role,
        profile_image_url: user.profile_image_url
    };
};

exports.findUserById = async (userId) => {
    const query = `
        SELECT 
            user.user_id,
            user.email,
            user.name,
            department.department_id,
            department.department_name,
            user.role,
            user.profile_image_url
        FROM 
            user
        JOIN 
            department ON user.department_id = department.department_id
        WHERE 
            user.user_id = ?
    `;
    const [rows] = await pool.query(query, [userId]);
    if (rows.length === 0) return null;

    const user = rows[0];
    return {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        department: {
            department_id: user.department_id,
            department_name: user.department_name
        },
        role: user.role,
        profile_image_url: user.profile_image_url
    };
};

exports.getAllUsers = async () => {
    const query = `
        SELECT 
            user.user_id,
            user.email,
            user.name,
            department.department_id,
            department.department_name,
            user.role,
            user.profile_image_url
        FROM 
            user
        JOIN 
            department ON user.department_id = department.department_id
    `;
    const [rows] = await pool.query(query);

    return rows.map(user => ({
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        department: {
            department_id: user.department_id,
            department_name: user.department_name
        },
        role: user.role,
        profile_image_url: user.profile_image_url
    }));
};

// Update the OTP code and expiry time for a user
exports.updateOtp = async (userId, otp, otpExpiresAt) => {
    const query = `
        UPDATE user 
        SET otp_code = ?, otp_expires_at = ? 
        WHERE user_id = ?
    `;
    await pool.query(query, [otp, otpExpiresAt, userId]);
};

// Verify the OTP code for a user
exports.verifyOtp = async (userId, otp) => {
    const query = `
        SELECT * FROM user 
        WHERE user_id = ? AND otp_code = ? AND otp_expires_at > NOW()
    `;
    const [rows] = await pool.query(query, [userId, otp]);
    return rows.length > 0;
};

// Update the password for a user
exports.updatePassword = async (userId, passwordHashed) => {
    const query = `
        UPDATE user 
        SET password_hashed = ? 
        WHERE user_id = ?
    `;
    await pool.query(query, [passwordHashed, userId]);
};

// Update user name
exports.updateName = async (userId, name) => {
    const query = `
        UPDATE user 
        SET name = ? 
        WHERE user_id = ?
    `;
    await pool.query(query, [name, userId]);
};

// Update user department
exports.updateDepartment = async (userId, departmentId) => {
    const query = `
        UPDATE user 
        SET department_id = ? 
        WHERE user_id = ?
    `;
    await pool.query(query, [departmentId, userId]);
};

// Update user role
exports.updateRole = async (userId, role) => {
    const query = `
        UPDATE user 
        SET role = ? 
        WHERE user_id = ?
    `;
    await pool.query(query, [role, userId]);
};

// Update user profile
exports.updateProfileImage = async (userId, profileImageUrl) => {
    const query = `
        UPDATE user 
        SET profile_image_url = ? 
        WHERE user_id = ?
    `;
    await pool.query(query, [profileImageUrl, userId]);
};

// Delete a user by userId
exports.deleteUserById = async (userId) => {
    const query = `
        DELETE FROM user 
        WHERE user_id = ?
    `;
    await pool.query(query, [userId]);
};

// Delete a user by email
exports.deleteUserByEmail = async (email) => {
    const query = `
        DELETE FROM user 
        WHERE email = ?
    `;
    await pool.query(query, [email]);
};
