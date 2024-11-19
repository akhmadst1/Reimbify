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

// Get all departments
exports.getAllDepartments = async () => {
    const query = `
        SELECT * FROM department
    `;
    const [rows] = await pool.query(query);

    // Map results to camelCase
    return rows.map(department => ({
        departmentId: department.department_id,
        departmentName: department.department_name,
    }));
};

// Get department by ID
exports.getDepartmentById = async (departmentId) => {
    const query = `
        SELECT * FROM department WHERE department_id = ?
    `;
    const [rows] = await pool.query(query, [departmentId]);
    if (rows.length === 0) return null;

    const department = rows[0];
    return {
        departmentId: department.department_id,
        departmentName: department.department_name,
    };
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
