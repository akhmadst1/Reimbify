const express = require('express');
const {
    updateProfileDetails,
    updateProfileImage
} = require('../controllers/profileController');

const { verifyToken } = require('../middlewares/authMiddleware');
const router = express.Router();

router.put('/update-profile-details', verifyToken, updateProfileDetails);
router.put('/update-profile-image', verifyToken, updateProfileImage);

module.exports = router;
