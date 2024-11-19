const express = require('express');
const {
    createDepartment,
    getDepartments,
    updateDepartment,
    deleteDepartment
} = require('../controllers/departmentController');

const { verifyToken } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/create', verifyToken, createDepartment);
router.get('', verifyToken, getDepartments);
router.put('/update', verifyToken, updateDepartment);
router.delete('/delete', verifyToken, deleteDepartment);

module.exports = router;
