const {
    createBankAccount,
    findBankAccountById,
    findBankAccountsByUserId,
    updateBankAccount,
    deleteBankAccountById,
    deleteBankAccountsByUserId,
} = require('../models/bankAccountModel');
const { findUserById } = require('../models/userModel'); // Assuming a user model exists for validation

// Create a new bank account
exports.createBankAccount = async (req, res, next) => {
    try {
        const { accountTitle, accountHolderName, accountNumber, bankName, userId } = req.body;

        // Validate user existence
        const user = await findUserById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found. Cannot create bank account.' });
        }

        await createBankAccount(accountTitle, accountHolderName, accountNumber, bankName, userId);
        res.status(201).json({ message: 'Bank account created successfully.' });
    } catch (error) {
        next(error);
    }
};

// Get bank accounts
exports.getBankAccounts = async (req, res, next) => {
    try {
        const { accountId, userId } = req.query;

        if (accountId) {
            const account = await findBankAccountById(accountId);
            if (!account) {
                return res.status(404).json({ message: 'Bank account not found.' });
            }
            return res.status(200).json({ account });
        }

        if (userId) {
            // Validate user existence
            const user = await findUserById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found.' });
            }

            const accounts = await findBankAccountsByUserId(userId);
            if (accounts.length === 0) {
                return res.status(404).json({ message: 'No bank accounts found for this user.' });
            }
            return res.status(200).json({ accounts });
        }

        return res.status(400).json({ message: 'Please provide either account id or user id.' });
    } catch (error) {
        next(error);
    }
};

// Update a bank account
exports.updateBankAccount = async (req, res, next) => {
    try {
        const { accountId } = req.query;

        if (!accountId) {
            return res.status(400).json({ message: 'Account ID is required for update.' });
        }

        const { accountTitle, accountHolderName, accountNumber, bankName } = req.body;

        const account = await findBankAccountById(accountId);
        if (!account) {
            return res.status(404).json({ message: 'Bank account not found.' });
        }

        // Ensure the associated user exists
        const user = await findUserById(account.user_id);
        if (!user) {
            return res.status(404).json({ message: 'User not found. Cannot update bank account.' });
        }

        await updateBankAccount(accountId, accountTitle, accountHolderName, accountNumber, bankName);
        res.status(200).json({ message: 'Bank account updated successfully.' });
    } catch (error) {
        next(error);
    }
};

// Delete bank accounts
exports.deleteBankAccounts = async (req, res, next) => {
    try {
        const { accountId, userId } = req.query;

        if (accountId) {
            const account = await findBankAccountById(accountId);
            if (!account) {
                return res.status(404).json({ message: 'Bank account not found.' });
            }

            // Ensure the associated user exists
            const user = await findUserById(account.user_id);
            if (!user) {
                return res.status(404).json({ message: 'User not found. Cannot delete bank account.' });
            }

            await deleteBankAccountById(accountId);
            return res.status(200).json({ message: 'Bank account deleted successfully.' });
        }

        if (userId) {
            // Validate user existence
            const user = await findUserById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found. Cannot delete bank accounts.' });
            }

            await deleteBankAccountsByUserId(userId);
            return res.status(200).json({ message: 'All bank accounts for the user deleted successfully.' });
        }

        return res.status(400).json({ message: 'Please provide either account id or user id for deletion.' });
    } catch (error) {
        next(error);
    }
};
