const {
    updateName,
    updateDepartment,
    updateRole,
    updateProfileImage,
    findUserById
} = require('../models/userModel'); // Adjust the path to your user model file
const Multer = require('multer')
const ImageUploader = require('../utils/imageUploader')

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
    multer.single('profileImage'), // Handle file upload
    (req, res, next) => {
        // Call the ImageUploader with the type 'profile image'
        ImageUploader.uploadToGcs(req, res, next, 'profile');
    },
    async (req, res, next) => {
        try {
            const { id } = req.query; // User ID

            // Validate input
            if (!id) {
                return res.status(400).json({ message: 'User ID is required' });
            }

            // Check if the user exists
            const user = await findUserById(id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Check if a file was uploaded
            if (!req.file || !req.file.cloudStoragePublicUrl) {
                return res.status(400).json({ message: 'Profile image is required' });
            }

            // Update profile image URL in the database
            const profileImageUrl = req.file.cloudStoragePublicUrl;
            await updateProfileImage(id, profileImageUrl);

            // Fetch updated user
            const updatedUser = await findUserById(id);

            res.status(200).json({ message: 'Profile image updated successfully', user: updatedUser });
        } catch (error) {
            next(error); // Pass errors to the global error handler
        }
    }
];

exports.uploadReimbursementNote = [
    multer.single('noteImage'), // Handle file upload
    (req, res, next) => {
        const { id } = req.query; // Fetch user ID from query parameters

        // Validate input
        if (!id) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        // Call the ImageUploader with the type 'notes' and userId
        ImageUploader.uploadToGcs(req, res, next, 'notes', id);
    },
    async (req, res, next) => {
        try {
            const { id } = req.query; // User ID

            // Validate input
            if (!req.file || !req.file.cloudStoragePublicUrl) {
                return res.status(400).json({ message: 'Reimbursement note image is required' });
            }

            // Here you can add logic to save the note's image URL to the database
            const noteImageUrl = req.file.cloudStoragePublicUrl;

            // Mock example of database save
            // await saveReimbursementNoteImage(id, noteImageUrl);

            res.status(200).json({
                message: 'Reimbursement note image uploaded successfully',
                userId: id,
                noteImageUrl,
            });
        } catch (error) {
            next(error); // Pass errors to the global error handler
        }
    }
];
