const pool = require('../config/pool'); // Import Cloud SQL connection pool

// Create a new bank account
exports.createBankAccount = async (accountTitle, accountHolderName, accountNumber, bankName, userId) => {
    const query = `
        INSERT INTO bank_account (account_title, account_holder_name, account_number, bank_name, user_id)
        VALUES (?, ?, ?, ?, ?)
    `;

    try {
        await pool.query(query, [accountTitle, accountHolderName, accountNumber, bankName, userId]);
    } catch (err) {
        throw err; // Handle or log errors appropriately
    }
};

// Find a bank account by ID
exports.findBankAccountById = async (id) => {
    const query = `
        SELECT * FROM bank_account WHERE id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0];
};

// Find all bank accounts for a specific user
exports.findBankAccountsByUserId = async (userId) => {
    const query = `
        SELECT * FROM bank_account WHERE user_id = ?
    `;
    const [rows] = await pool.query(query, [userId]);
    return rows;
};

// Update a bank account
exports.updateBankAccount = async (id, accountTitle, accountHolderName, accountNumber, bankName) => {
    const query = `
        UPDATE bank_account
        SET account_title = ?, account_holder_name = ?, account_number = ?, bank_name = ?
        WHERE id = ?
    `;
    await pool.query(query, [accountTitle, accountHolderName, accountNumber, bankName, id]);
};

// Delete a bank account by ID
exports.deleteBankAccountById = async (id) => {
    const query = `
        DELETE FROM bank_account WHERE id = ?
    `;
    await pool.query(query, [id]);
};

// Delete bank accounts by user ID
exports.deleteBankAccountsByUserId = async (userId) => {
    const query = `
        DELETE FROM bank_account WHERE user_id = ?
    `;
    await pool.query(query, [userId]);
};
