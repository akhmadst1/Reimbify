const {
    createReceipt,
    getFilteredReceipts,
    getReceiptById,
    updateReceipt,
    deleteReceiptById,
    updateReceiptApproval
} = require('../models/receiptModel');
const { getUserById } = require('../models/userModel');
const { getDepartmentById } = require('../models/departmentModel');
const { getBankAccountById } = require('../models/bankAccountModel');
const Multer = require('multer');
const { ImgUpload, bucket } = require('../utils/imageUploader'); // Import image upload logic

// Set up Multer for image upload
const multer = Multer({
    storage: Multer.MemoryStorage,
    fileSize: 10 * 1024 * 1024 // Limit file size to 10MB
});

// Middleware to upload the receipt image
exports.uploadReceiptImage = [
    multer.single('receiptImage'), // Handle the image file upload

    // Middleware to upload image to GCS
    ImgUpload.uploadToGcsReceipts,

    // Return the image URL after successful upload
    async (req, res, next) => {
        try {
            if (!req.file || req.file.cloudStorageError) {
                return res.status(400).json({
                    message: 'Image upload failed',
                    error: req.file ? req.file.cloudStorageError : 'No file uploaded'
                });
            }

            res.status(200).json({
                message: 'Image uploaded successfully',
                receiptImageUrl: req.file.cloudStoragePublicUrl // Send the image URL back to the client
            });
        } catch (error) {
            next(error); // Pass any errors to the error handler
        }
    }
];

// Middleware to upload reimbursement transfer proof image
exports.uploadTransferImage = [
    multer.single('transferImage'), // Handle the image file upload

    // Middleware to upload image to GCS
    ImgUpload.uploadToGcsReimbursementProof,

    // Return the image URL after successful upload
    async (req, res, next) => {
        try {
            if (!req.file || req.file.cloudStorageError) {
                return res.status(400).json({
                    message: 'Image upload failed',
                    error: req.file ? req.file.cloudStorageError : 'No file uploaded',
                });
            }

            res.status(200).json({
                message: 'Reimbursement proof image uploaded successfully',
                transferImageUrl: req.file.cloudStoragePublicUrl, // Send the image URL back to the client
            });
        } catch (error) {
            next(error); // Pass any errors to the error handler
        }
    },
];

// Controller to create the receipt and save the URL
exports.createReceipt = async (req, res, next) => {
    try {
        const { requesterId, departmentId, accountId, receiptDate, description, amount, receiptImageUrl } = req.body;

        // Validate required fields
        if (!requesterId || !departmentId || !accountId || !receiptDate || !amount || !receiptImageUrl) {
            return res.status(400).json({ message: 'Please provide all required fields.' });
        }

        // Validate if the user exists
        const user = await getUserById(requesterId);
        if (!user) {
            return res.status(404).json({ message: 'Requester account not found.' });
        }

        // Validate if the department exists
        const department = await getDepartmentById(departmentId);
        if (!department) {
            return res.status(404).json({ message: 'Department not found.' });
        }

        // Validate if the bank account exists
        const account = await getBankAccountById(accountId);
        if (!account) {
            return res.status(404).json({ message: 'Bank account not found.' });
        }

        // Create the receipt object
        const receipt = {
            requesterId,
            departmentId,
            accountId,
            receiptDate,
            description,
            amount,
            receiptImageUrl
        };

        // Call the model to create a new receipt
        const createdReceipt = await createReceipt(receipt);

        res.status(201).json({ message: 'Receipt created successfully.' });
    } catch (error) {
        next(error); // Pass any errors to the error handler
    }
};

// Get receipts
exports.getReceipts = async (req, res, next) => {
    try {
        const { receiptId, userId, sorted, search, departmentId, status } = req.query;

        if (receiptId) {
            const receipt = await getReceiptById(receiptId);
            if (!receipt) {
                return res.status(404).json({ message: 'Receipt not found.' });
            }
            return res.status(200).json({ receipt });
        }

        // Fetch receipts based on parameters
        const receipts = await getFilteredReceipts({ userId, sorted, search, departmentId, status });
        if (receipts.length === 0) {
            return res.status(404).json({ message: 'No receipts found.' });
        }

        return res.status(200).json({ receipts });
    } catch (error) {
        next(error);
    }
};

// Update receipt by ID
exports.updateReceipt = async (req, res, next) => {
    try {
        const { receiptId } = req.query;
        const { requesterId, departmentId, accountId, receiptDate, description, amount, receiptImageUrl } = req.body;

        if (!receiptId) {
            return res.status(400).json({ message: 'Receipt ID is required for update.' });
        }

        if (!requesterId || !departmentId || !accountId || !receiptDate || !description || !amount || !receiptImageUrl) {
            return res.status(400).json({ message: 'All fields are required for update.' });
        }

        const receipt = await getReceiptById(receiptId);
        if (!receipt) {
            return res.status(404).json({ message: 'Receipt not found.' });
        }

        // Prevent updating requestDate
        const updatedData = { requesterId, departmentId, accountId, receiptDate, description, amount, receiptImageUrl };
        await updateReceipt(receiptId, updatedData);
        res.status(200).json({ message: 'Receipt updated successfully.' });
    } catch (error) {
        next(error);
    }
};

// Delete receipt by ID
exports.deleteReceipt = async (req, res, next) => {
    try {
        const { receiptId } = req.query;

        if (!receiptId) {
            return res.status(400).json({ message: 'Receipt ID is required for deletion.' });
        }

        const receipt = await getReceiptById(receiptId);
        if (!receipt) {
            return res.status(404).json({ message: 'Receipt not found.' });
        }

        await deleteReceiptById(receiptId);

        const receiptImage = receipt.receiptImageUrl;
        if (receiptImage) {
            const gcsnameReceiptImage = 'receipts/' + receipt.receiptImageUrl.split("receipts/")[1];
            const fileReceiptImage = bucket.file(gcsnameReceiptImage);
            await fileReceiptImage.delete();
        }

        const transferImage = receipt.approval.transferImageUrl;
        if (transferImage) {
            const gcsnameTransferImage = 'receipts/' + transferImage.split("receipts/")[1];
            const fileTransferImage = bucket.file(gcsnameTransferImage);
            await fileTransferImage.delete();
        }

        res.status(200).json({ message: 'Receipt deleted successfully.' });
    } catch (error) {
        if (error.code === 404) {
            res.status(404).json({ message: 'File not found in storage' });
        } else {
            next(error); // Pass other errors to the global error handler
        }
    }
};

// Approve or reject a receipt
exports.approveReceipt = async (req, res, next) => {
    try {
        const { receiptId } = req.query;
        const { status, adminId, responseDescription, transferImageUrl } = req.body;

        // Validate required fields
        if (!receiptId || !status || !adminId || !responseDescription) {
            return res.status(400).json({ message: 'Please provide all required fields: receiptId, status, adminId, and responseDescription.' });
        }

        // Ensure status is valid
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Status must be either "approved" or "rejected".' });
        }

        // Fetch the receipt
        const receipt = await getReceiptById(receiptId);
        if (!receipt) {
            return res.status(404).json({ message: 'Receipt not found.' });
        }

        // Ensure the receipt is under review before approval or rejection
        if (receipt.status !== 'under_review') {
            return res.status(400).json({ message: `Receipt cannot be ${status}. Current status is "${receipt.status}".` });
        }

        // Update the receipt with approval/rejection details
        const responseDate = new Date();
        await updateReceiptApproval(receiptId, {
            status,
            adminId,
            responseDate,
            responseDescription,
            transferImageUrl: transferImageUrl || null // Optional
        });

        res.status(200).json({
            message: `Receipt successfully ${status}.`,
            receiptId,
            status,
            adminId,
            responseDate,
            responseDescription,
            transferImageUrl
        });
    } catch (error) {
        next(error); // Pass errors to the error handler
    }
};
