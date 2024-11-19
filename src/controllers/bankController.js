const {
    createBank,
    getAllBanks,
    getBankById,
    updateBankName,
    deleteBankById
} = require('../models/bankModel');

// Create a new bank
exports.createBank = async (req, res, next) => {
    try {
        const { bankName } = req.body;
        
        if (!bankName) {
            return res.status(400).json({ message: 'Bank name is required.' });
        }

        await createBank(bankName);
        res.status(201).json({ message: 'Bank created successfully.' });
    } catch (error) {
        next(error);
    }
};

// Get all banks
exports.getBanks = async (req, res, next) => {
    try {
        const banks = await getAllBanks();
        if (banks.length === 0) {
            return res.status(404).json({ message: 'No banks found.' });
        }

        return res.status(200).json({ banks });
    } catch (error) {
        next(error);
    }
};

// Get bank by ID
exports.getBankById = async (req, res, next) => {
    try {
        const { bankId } = req.query;

        if (!bankId) {
            return res.status(400).json({ message: 'Bank ID is required.' });
        }

        const bank = await getBankById(bankId);
        if (!bank) {
            return res.status(404).json({ message: 'Bank not found.' });
        }

        return res.status(200).json({ bank });
    } catch (error) {
        next(error);
    }
};

// Update bank name by ID
exports.updateBank = async (req, res, next) => {
    try {
        const { bankId } = req.query;
        const { bankName } = req.body;

        if (!bankId) {
            return res.status(400).json({ message: 'Bank ID is required for update.' });
        }

        if (!bankName) {
            return res.status(400).json({ message: 'Bank name is required.' });
        }

        const bank = await getBankById(bankId);
        if (!bank) {
            return res.status(404).json({ message: 'Bank not found.' });
        }

        await updateBankName(bankId, bankName);
        res.status(200).json({ message: 'Bank updated successfully.' });
    } catch (error) {
        next(error);
    }
};

// Delete bank by ID
exports.deleteBank = async (req, res, next) => {
    try {
        const { bankId } = req.query;

        if (!bankId) {
            return res.status(400).json({ message: 'Bank ID is required for deletion.' });
        }

        const bank = await getBankById(bankId);
        if (!bank) {
            return res.status(404).json({ message: 'Bank not found.' });
        }

        await deleteBankById(bankId);
        res.status(200).json({ message: 'Bank deleted successfully.' });
    } catch (error) {
        next(error);
    }
};
