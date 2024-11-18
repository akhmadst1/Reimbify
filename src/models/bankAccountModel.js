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

// Find all bank accounts
exports.getAllBankAccounts = async () => {
    const query = `
        SELECT * FROM bank_account
    `;
    const [rows] = await pool.query(query);
    return rows;
};

// Find a bank account by ID
exports.findBankAccountById = async (accountId) => {
    const query = `
        SELECT * FROM bank_account WHERE account_id = ?
    `;
    const [rows] = await pool.query(query, [accountId]);
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
exports.updateBankAccount = async (accountId, accountTitle, accountHolderName, accountNumber, bankName) => {
    const query = `
        UPDATE bank_account
        SET account_title = ?, account_holder_name = ?, account_number = ?, bank_name = ?
        WHERE account_id = ?
    `;
    await pool.query(query, [accountTitle, accountHolderName, accountNumber, bankName, accountId]);
};

// Delete a bank account by ID
exports.deleteBankAccountById = async (accountId) => {
    const query = `
        DELETE FROM bank_account WHERE account_id = ?
    `;
    await pool.query(query, [accountId]);
};

// Delete bank accounts by user ID
exports.deleteBankAccountsByUserId = async (userId) => {
    const query = `
        DELETE FROM bank_account WHERE user_id = ?
    `;
    await pool.query(query, [userId]);
};
