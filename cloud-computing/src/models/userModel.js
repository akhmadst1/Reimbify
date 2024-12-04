const pool = require('../config/pool'); // Import Cloud SQL connection pool

// Create a new user in the database
exports.createUser = async (email, passwordHashed, userName, departmentId, role = 'user') => {
    // Generate a random 6-digit ID
    const randomId = Math.floor(100000 + Math.random() * 900000);

    // SQL query to insert the new user
    const query = `
        INSERT INTO user (user_id, email, password_hashed, user_name, department_id, role)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    try {
        await pool.query(query, [randomId, email, passwordHashed, userName, departmentId, role]);
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            // Handle duplicate ID collision by retrying with a new ID
            console.error('Duplicate ID detected. Retrying...');
            return await exports.createUser(email, passwordHashed, userName, departmentId, role); // Recursive retry
        }
        throw err; // Rethrow any other errors
    }
};

exports.getHashedPassword = async (userId) => {
    const query = `
        SELECT
            password_hashed 
        FROM 
            user 
        WHERE 
            user_id = ?
    `;
    const [rows] = await pool.query(query, [userId]);
    return rows[0].password_hashed;
};

function formatUser(user) {
    return {
        userId: user.user_id,
        email: user.email,
        userName: user.user_name,
        department: {
            departmentId: user.department_id,
            departmentName: user.department_name
        },
        role: user.role,
        profileImageUrl: user.profile_image_url
    };
}

exports.getUserByEmail = async (email) => {
    const query = `
        SELECT 
            user.user_id,
            user.email,
            user.user_name,
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
    return rows.length ? formatUser(rows[0]) : null;
};

exports.getUserById = async (userId) => {
    const query = `
        SELECT 
            user.user_id,
            user.email,
            user.user_name,
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
    return rows.length ? formatUser(rows[0]) : null;
};

exports.getUsersByDepartmentId = async (departmentId) => {
    const query = `
        SELECT 
            user.user_id,
            user.email,
            user.user_name,
            department.department_id,
            department.department_name,
            user.role,
            user.profile_image_url
        FROM 
            user
        JOIN 
            department ON user.department_id = department.department_id
        WHERE 
            department.department_id = ?
    `;
    
    const [rows] = await pool.query(query, [departmentId]);
    
    return rows.map(formatUser);
};

exports.getAllUsers = async () => {
    const query = `
        SELECT 
            user.user_id,
            user.email,
            user.user_name,
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
    return rows.map(formatUser);
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
        SET user_name = ? 
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
