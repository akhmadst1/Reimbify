const express = require('express');
const {
    createBankAccount,
    getBankAccounts,
    updateBankAccount,
    deleteBankAccounts
} = require('../controllers/bankAccountController');

const { verifyToken } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/create', verifyToken, createBankAccount);
router.get('/account', verifyToken, getBankAccounts);
router.put('/update', verifyToken, updateBankAccount);
router.delete('/delete', verifyToken, deleteBankAccounts);

module.exports = router;
