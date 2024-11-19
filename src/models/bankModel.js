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

    // Map results to camelCase
    return rows.map(bank => ({
        bankId: bank.bank_id,
        bankName: bank.bank_name,
    }));
};

// Get bank by ID
exports.getBankById = async (bankId) => {
    const query = `
        SELECT * FROM bank WHERE bank_id = ?
    `;
    const [rows] = await pool.query(query, [bankId]);
    if (rows.length === 0) return null;

    const bank = rows[0];
    return {
        bankId: bank.bank_id,
        bankName: bank.bank_name,
    };
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
