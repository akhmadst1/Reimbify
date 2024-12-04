const {
    createBankAccount,
    getBankAccountById,
    getBankAccountsByUserId,
    updateBankAccount,
    deleteBankAccountById,
    deleteBankAccountsByUserId,
    getAllBankAccounts,
} = require('../models/bankAccountModel');
const { getUsers } = require('../models/userModel');
const { encrypt, decrypt } = require('../utils/encryption');

// Create a new bank account
exports.createBankAccount = async (req, res, next) => {
    try {
        const { accountTitle, accountHolderName, accountNumber, bankId, userId } = req.body;
        
        // Validate user existence
        const user = await getUsers(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found. Cannot create bank account.' });
        }
        
        const encryptedAccountNumber = encrypt(accountNumber);
        
        await createBankAccount(accountTitle, accountHolderName, encryptedAccountNumber, bankId, userId);
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
            const account = await getBankAccountById(accountId);
            if (!account) {
                return res.status(404).json({ message: 'Bank account not found.' });
            }
            
            account.accountNumber = decrypt(account.accountNumber);
            return res.status(200).json({ account });
        }
        
        if (userId) {
            // Validate user existence
            const user = await getUsers(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found.' });
            }

            const accounts = await getBankAccountsByUserId(userId);
            if (accounts.length === 0) {
                return res.status(404).json({ message: 'No bank accounts found for this user.' });
            }

            accounts.forEach(account => {
                account.accountNumber = decrypt(account.accountNumber);
            });

            return res.status(200).json({ accounts });
        }

        const accounts = await getAllBankAccounts();
        if (!accounts) {
            return res.status(404).json({ message: 'Bank account not found.' });
        }

        accounts.forEach(account => {
            account.accountNumber = decrypt(account.accountNumber);
        });

        return res.status(200).json({ accounts });
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

        const { accountTitle, accountHolderName, accountNumber, bankId } = req.body;

        const account = await getBankAccountById(accountId);
        if (!account) {
            return res.status(404).json({ message: 'Bank account not found.' });
        }

        // Ensure the associated user exists
        const userId = account.user.userId;
        const user = await getUsers(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found. Cannot update bank account.' });
        }

        // Encrypt the account number if it's provided
        let encryptedAccountNumber = account.accountNumber;
        if (accountNumber) {
            encryptedAccountNumber = encrypt(accountNumber);
        }

        await updateBankAccount(accountId, accountTitle, accountHolderName, encryptedAccountNumber, bankId);
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
            const account = await getBankAccountById(accountId);
            if (!account) {
                return res.status(404).json({ message: 'Bank account not found.' });
            }

            // Ensure the associated user exists
            const userId = account.user.userId;
            const user = await getUsers(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found. Cannot delete bank account.' });
            }

            await deleteBankAccountById(accountId);
            return res.status(200).json({ message: 'Bank account deleted successfully.' });
        }

        if (userId) {
            // Validate user existence
            const user = await getUsers(userId);
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
