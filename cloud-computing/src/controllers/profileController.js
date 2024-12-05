const {
    updateName,
    updateDepartment,
    updateRole,
    updateProfileImage,
    getUsers
} = require('../models/userModel');
const Multer = require('multer')
const { ImgUpload, bucket } = require('../utils/imageUploader');

const multer = Multer({
    storage: Multer.MemoryStorage,
    fileSize: 10 * 1024 * 1024 // Limit file size to 10MB
})

exports.updateProfileDetails = async (req, res, next) => {
    try {
        const { userId } = req.query; // User ID
        // Validate input
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }
        
        // Check if the user exists
        const userArray = await getUsers(userId);
        if (userArray.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const { name, departmentId, role } = req.body;
        // Update fields if provided
        if (name) {
            await updateName(userId, name);
        }
        if (departmentId) {
            await updateDepartment(userId, departmentId);
        }
        if (role) {
            await updateRole(userId, role);
        }

        // Fetch updated user
        const updatedUser = await getUsers(userId);

        res.status(200).json({ message: 'Profile details updated successfully', user: updatedUser[0] });
    } catch (error) {
        next(error); // Pass errors to the global error handler
    }
};

exports.updateProfileImage = [
    // Middleware to handle the file upload
    multer.single('profileImage'),
    
    // Middleware to validate user ID and file upload
    async (req, res, next) => {
        const { userId } = req.query;

        // Validate user ID
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        try {
            // Check if the user exists
            const userArray = await getUsers(userId);
            if (userArray.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Proceed to next middleware
            next();
        } catch (error) {
            console.error('Error finding user:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    // Middleware to upload the file to Google Cloud Storage
    ImgUpload.uploadToGcsProfileImages,

    // Final middleware to update the profile and send the response
    async (req, res) => {
        if (!req.file || req.file.cloudStorageError) {
            return res.status(400).json({
                success: false,
                message: 'Image upload failed',
                error: req.file ? req.file.cloudStorageError : 'No file uploaded'
            });
        }

        const { userId } = req.query;

        try {
            // Update profile image in the database
            await updateProfileImage(userId, req.file.cloudStoragePublicUrl);

            // Return the public URL of the uploaded image
            res.status(200).json({
                success: true,
                message: 'Profile image uploaded successfully',
                imageUrl: req.file.cloudStoragePublicUrl
            });
        } catch (error) {
            console.error('Error updating profile image:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
];

exports.deleteProfileImage = async (req, res, next) => {
    try {
        const { userId } = req.query; // User ID

        // Check if the user exists
        const userArray = await getUsers(userId);
        if (userArray.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = userArray[0];

        // Get the profile image URL
        const profileImageUrl = user.profileImageUrl;
        if (!profileImageUrl) {
            return res.status(400).json({ message: 'No profile image to delete' });
        }

        // Extract the GCS object name
        const gcsname = `profile_images/${userId}`;

        // Delete the file from Google Cloud Storage
        const file = bucket.file(gcsname);
        await file.delete();

        // Update the user's profile image URL to null in the database
        await updateProfileImage(userId, null);

        res.status(200).json({ message: 'Profile image deleted successfully' });
    } catch (error) {
        if (error.code === 404) {
            res.status(404).json({ message: 'File not found in storage' });
        } else {
            next(error); // Pass other errors to the global error handler
        }
    }
};
