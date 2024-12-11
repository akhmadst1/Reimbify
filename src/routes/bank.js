const express = require('express');
const {
    createBank,
    getBanks,
    updateBank,
    deleteBank
} = require('../controllers/bankController');

const { verifyToken } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/create', verifyToken, createBank);
router.get('', verifyToken, getBanks);
router.put('/update', verifyToken, updateBank);
router.delete('/delete', verifyToken, deleteBank);

module.exports = router;
