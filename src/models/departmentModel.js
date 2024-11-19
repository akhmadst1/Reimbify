const pool = require('../config/pool'); // Import Cloud SQL connection pool

// Create a department
exports.createDepartment = async (departmentName) => {
    const query = `
        INSERT INTO department (department_name)
        VALUES (?)
    `;

    try {
        await pool.query(query, [departmentName]);
    } catch (err) {
        throw err; // Handle or log errors appropriately
    }
};

// Get all department
exports.getAllDepartments = async () => {
    const query = `
        SELECT * FROM department
    `;
    const [rows] = await pool.query(query);
    return rows; // Return the departments array
};

// Get department by ID
exports.getDepartmentById = async (departmentId) => {
    const query = `
        SELECT * FROM department WHERE department_id = ?
    `;
    const [rows] = await pool.query(query, [departmentId]);
    return rows[0]; // Return the department object if found
};

// Update department name by ID
exports.updateDepartmentName = async (departmentId, newDepartmentName) => {
    const query = `
        UPDATE department
        SET department_name = ?
        WHERE department_id = ?
    `;
    try {
        await pool.query(query, [newDepartmentName, departmentId]);
    } catch (err) {
        throw err; // Handle or log errors appropriately
    }
};

// Delete department by ID
exports.deleteDepartmentById = async (departmentId) => {
    const query = `
        DELETE FROM department WHERE department_id = ?
    `;
    try {
        await pool.query(query, [departmentId]);
    } catch (err) {
        throw err; // Handle or log errors appropriately
    }
};
