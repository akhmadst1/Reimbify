const pool = require('../config/pool'); // Import Cloud SQL connection pool

// Create a bank
exports.createBank = async (bankName) => {
    const query = `
        INSERT INTO bank (bank_name)
        VALUES (?)
    `;

    try {
        await pool.query(query, [bankName]);
    } catch (err) {
        throw err; // Handle or log errors appropriately
    }
};

// Get all banks
exports.getAllBanks = async () => {
    const query = `
        SELECT * FROM bank
    `;
    const [rows] = await pool.query(query);
    return rows; // Return the banks array
};

// Get bank by ID
exports.getBankById = async (bankId) => {
    const query = `
        SELECT * FROM bank WHERE bank_id = ?
    `;
    const [rows] = await pool.query(query, [bankId]);
    return rows[0]; // Return the bank object if found
};

// Update bank name by ID
exports.updateBankName = async (bankId, newBankName) => {
    const query = `
        UPDATE bank
        SET bank_name = ?
        WHERE bank_id = ?
    `;
    try {
        await pool.query(query, [newBankName, bankId]);
    } catch (err) {
        throw err; // Handle or log errors appropriately
    }
};

// Delete bank by ID
exports.deleteBankById = async (bankId) => {
    const query = `
        DELETE FROM bank WHERE bank_id = ?
    `;
    try {
        await pool.query(query, [bankId]);
    } catch (err) {
        throw err; // Handle or log errors appropriately
    }
};
