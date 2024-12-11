const pool = require('../config/pool'); // Import Cloud SQL connection pool

// Create a new bank account
exports.createBankAccount = async (accountTitle, accountHolderName, encryptedAccountNumber, bankId, userId) => {
    const query = `
        INSERT INTO bank_account (account_title, account_holder_name, account_number_encrypted, bank_id, user_id)
        VALUES (?, ?, ?, ?, ?)
    `;

    try {
        await pool.query(query, [accountTitle, accountHolderName, encryptedAccountNumber, bankId, userId]);
    } catch (err) {
        throw err; // Handle or log errors appropriately
    }
};

function formatBankAccount(row) {
    return {
        accountId: row.account_id,
        accountTitle: row.account_title,
        accountHolderName: row.account_holder_name,
        accountNumber: row.account_number_encrypted,
        user: {
            userId: row.user_id,
            userName: row.user_name,
        },
        bank: {
            bankId: row.bank_id,
            bankName: row.bank_name,
        }
    };
}

// Find all bank accounts with user and bank details
exports.getAllBankAccounts = async () => {
    const query = `
        SELECT 
            ba.account_id,
            ba.account_title,
            ba.account_holder_name,
            ba.account_number_encrypted,
            u.user_id,
            u.user_name,
            b.bank_id,
            b.bank_name
        FROM bank_account ba
        JOIN user u ON ba.user_id = u.user_id
        JOIN bank b ON ba.bank_id = b.bank_id
    `;
    const [rows] = await pool.query(query);
    return rows.map(formatBankAccount);
};

// Find a bank account by ID with user and bank details
exports.getBankAccountById = async (accountId) => {
    const query = `
        SELECT 
            ba.account_id,
            ba.account_title,
            ba.account_holder_name,
            ba.account_number_encrypted,
            u.user_id,
            u.user_name,
            b.bank_id,
            b.bank_name
        FROM bank_account ba
        JOIN user u ON ba.user_id = u.user_id
        JOIN bank b ON ba.bank_id = b.bank_id
        WHERE ba.account_id = ?
    `;
    const [rows] = await pool.query(query, [accountId]);
    return rows.length ? formatBankAccount(rows[0]) : null;
};

// Find all bank accounts for a specific user with bank details
exports.getBankAccountsByUserId = async (userId) => {
    const query = `
        SELECT 
            ba.account_id,
            ba.account_title,
            ba.account_holder_name,
            ba.account_number_encrypted,
            u.user_id,
            u.user_name,
            b.bank_id,
            b.bank_name
        FROM bank_account ba
        JOIN user u ON ba.user_id = u.user_id
        JOIN bank b ON ba.bank_id = b.bank_id
        WHERE ba.user_id = ?
    `;
    const [rows] = await pool.query(query, [userId]);
    return rows.map(formatBankAccount);
};

// Update a bank account
exports.updateBankAccount = async (accountId, accountTitle, accountHolderName, encryptedAccountNumber, bankId) => {
    const query = `
        UPDATE bank_account
        SET account_title = ?, account_holder_name = ?, account_number_encrypted = ?, bank_id = ?
        WHERE account_id = ?
    `;
    await pool.query(query, [accountTitle, accountHolderName, encryptedAccountNumber, bankId, accountId]);
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
