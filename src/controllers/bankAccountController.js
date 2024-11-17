const {
    createBankAccount,
    findBankAccountById,
    findBankAccountsByUserId,
    updateBankAccount,
    deleteBankAccountById,
    deleteBankAccountsByUserId,
} = require('../models/bankAccountModel');

// Create a new bank account
exports.createBankAccount = async (req, res, next) => {
    try {
        const { accountTitle, accountHolderName, accountNumber, bankName, userId } = req.body;

        await createBankAccount(accountTitle, accountHolderName, accountNumber, bankName, userId);

        res.status(201).json({ message: 'Bank account created successfully.' });
    } catch (error) {
        next(error);
    }
};

// Get a bank account by ID or account number, or all accounts by userId
exports.getBankAccounts = async (req, res, next) => {
    try {
        const { id, userId } = req.query;

        if (id) {
            // Fetch account by ID
            const account = await findBankAccountById(id);
            if (!account) {
                return res.status(404).json({ message: 'Bank account not found.' });
            }
            return res.status(200).json({ account });
        }

        if (userId) {
            // Fetch all accounts by user ID
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
        const { id } = req.query;
        
        if (!id) {
            return res.status(400).json({ message: 'Account ID is required for update.' });
        }

        const { accountTitle, accountHolderName, accountNumber, bankName } = req.body;

        await updateBankAccount(id, accountTitle, accountHolderName, accountNumber, bankName);

        res.status(200).json({ message: 'Bank account updated successfully.' });
    } catch (error) {
        next(error);
    }
};

// Delete a bank account by ID or all accounts by userId
exports.deleteBankAccounts = async (req, res, next) => {
    try {
        const { id, userId } = req.body;

        if (id) {
            // Delete account by ID
            await deleteBankAccountById(id);
            return res.status(200).json({ message: 'Bank account deleted successfully.' });
        }

        if (userId) {
            // Delete all accounts by user ID
            await deleteBankAccountsByUserId(userId);
            return res.status(200).json({ message: 'All bank accounts for the user deleted successfully.' });
        }

        return res.status(400).json({ message: 'Please provide either account id or user id for deletion.' });

    } catch (error) {
        next(error);
    }
};
