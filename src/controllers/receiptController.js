const {
    createReceipt,
    getFilteredReceipts,
    getReceiptById,
    updateReceipt,
    deleteReceiptById
} = require('../models/receiptModel');
const { getDepartmentById } = require('../models/departmentModel');
const { getUserById } = require('../models/userModel');
const Multer = require('multer');
const { ImgUpload } = require('../utils/imageUploader'); // Import image upload logic

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
            const { userId, departmentId } = req.query;

            if (userId) {
                const user = await getUserById(userId);
                if (!user) {
                    return res.status(404).json({ message: 'User not found.' });
                }
            }

            if (departmentId) {
                const department = await getDepartmentById(departmentId);
                if (!department) {
                    return res.status(404).json({ message: 'Department not found.' });
                }
            }

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

// Controller to create the receipt and save the URL
exports.createReceipt = async (req, res, next) => {
    try {
        const { requesterId, departmentId, accountId, receiptDate, description, amount, receiptImageUrl } = req.body;

        // Validate required fields
        if (!requesterId || !departmentId || !accountId || !receiptDate || !amount || !receiptImageUrl) {
            return res.status(400).json({ message: 'Please provide all required fields.' });
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

        res.status(201).json({message: 'Receipt created successfully.'});
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
        const { requesterId, departmentId, accountId, receiptDate, description, amount, status, receiptImageUrl } = req.body;

        if (!receiptId) {
            return res.status(400).json({ message: 'Receipt ID is required for update.' });
        }

        if (!requesterId || !departmentId || !accountId || !receiptDate || !description || !amount || !status || !receiptImageUrl) {
            return res.status(400).json({ message: 'All fields are required for update.' });
        }

        const receipt = await getReceiptById(receiptId);
        if (!receipt) {
            return res.status(404).json({ message: 'Receipt not found.' });
        }

        // Prevent updating requestDate
        const updatedData = { requesterId, departmentId, accountId, receiptDate, description, amount, status, receiptImageUrl };
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
        res.status(200).json({ message: 'Receipt deleted successfully.' });
    } catch (error) {
        next(error);
    }
};
