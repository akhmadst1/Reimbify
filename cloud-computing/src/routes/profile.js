const express = require('express');
const {
    updateProfileDetails,
    updateProfileImage,
    deleteProfileImage
} = require('../controllers/profileController');

const { verifyToken } = require('../middlewares/authMiddleware');
const router = express.Router();

router.put('/details/update', verifyToken, updateProfileDetails);
router.put('/image/update', verifyToken, updateProfileImage);
router.delete('/image/delete', verifyToken, deleteProfileImage);

module.exports = router;
