const {
    updateName,
    updateDepartment,
    updateRole,
    updateProfileImage,
    findUserById
} = require('../models/userModel'); // Adjust the path to your user model file
const Multer = require('multer')
const imageUploader = require('../utils/imageUploader')

const multer = Multer({
    storage: Multer.MemoryStorage,
    fileSize: 10 * 1024 * 1024 // Limit file size to 10MB
})

exports.updateProfileDetails = async (req, res, next) => {
    try {
        const { id } = req.query; // User ID
        const { name, department, role } = req.body;

        // Validate input
        if (!id) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        // Check if the user exists
        const user = await findUserById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update fields if provided
        if (name) {
            await updateName(id, name);
        }
        if (department) {
            await updateDepartment(id, department);
        }
        if (role) {
            await updateRole(id, role);
        }

        // Fetch updated user
        const updatedUser = await findUserById(id);

        res.status(200).json({ message: 'Profile details updated successfully', user: updatedUser });
    } catch (error) {
        next(error); // Pass errors to the global error handler
    }
};

exports.updateProfileImage = [
    // Middleware to handle the file upload
    multer.single('profileImage'),
    // Middleware to upload the file to Google Cloud Storage
    imageUploader.uploadToGcs,
    // Final middleware to send the response
    (req, res) => {
        if (!req.file || req.file.cloudStorageError) {
            return res.status(400).json({
                success: false,
                message: 'Image upload failed',
                error: req.file ? req.file.cloudStorageError : 'No file uploaded'
            });
        }

        // Return the public URL of the uploaded image
        res.status(200).json({
            success: true,
            message: 'Profile image uploaded successfully',
            imageUrl: req.file.cloudStoragePublicUrl
        });
    }
];