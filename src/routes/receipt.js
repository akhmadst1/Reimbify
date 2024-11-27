const express = require('express');
const {
    uploadReceiptImage,
    createReceipt,
    getReceipts,
    updateReceipt,
    deleteReceipt,
    approveReceipt,
    uploadTransferImage
} = require('../controllers/receiptController');

const { verifyToken } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/image/upload', verifyToken, uploadReceiptImage);
router.post('/create', verifyToken, createReceipt);
router.get('', verifyToken, getReceipts);
router.patch('/update', verifyToken, updateReceipt);
router.delete('/delete', verifyToken, deleteReceipt);
router.post('/approval/image/upload', verifyToken, uploadTransferImage);
router.patch('/approval', verifyToken, approveReceipt);

module.exports = router;
