const {
    createDepartment,
    getAllDepartments,
    getDepartmentById,
    updateDepartmentName,
    deleteDepartmentById
} = require('../models/departmentModel');

// Create a new department
exports.createDepartment = async (req, res, next) => {
    try {
        const { departmentName } = req.body;

        if (!departmentName) {
            return res.status(400).json({ message: 'Department name is required.' });
        }

        await createDepartment(departmentName);
        res.status(201).json({ message: 'Department created successfully.' });
    } catch (error) {
        next(error);
    }
};

// Get departments
exports.getDepartments = async (req, res, next) => {
    try {
        const { departmentId } = req.query;

        if (departmentId) {
            const department = await getDepartmentById(departmentId);
            if (!department) {
                return res.status(404).json({ message: 'Department not found.' });
            }
            return res.status(200).json({ department });
        }

        const departments = await getAllDepartments();
        if (departments.length === 0) {
            return res.status(404).json({ message: 'No departments found.' });
        }

        return res.status(200).json({ departments });
    } catch (error) {
        next(error);
    }
};

// Update department name by ID
exports.updateDepartment = async (req, res, next) => {
    try {
        const { departmentId } = req.query;
        
        if (!departmentId) {
            return res.status(400).json({ message: 'Department ID is required for update.' });
        }
        
        const { departmentName } = req.body;
        
        if (!departmentName) {
            return res.status(400).json({ message: 'Department name is required.' });
        }
        
        const department = await getDepartmentById(departmentId);
        if (!department) {
            return res.status(404).json({ message: 'Department not found.' });
        }
        
        await updateDepartmentName(departmentId, departmentName);
        res.status(200).json({ message: 'Department updated successfully.' });
    } catch (error) {
        next(error);
    }
};

// Delete department by ID
exports.deleteDepartment = async (req, res, next) => {
    try {
        const { departmentId } = req.query;

        if (!departmentId) {
            return res.status(400).json({ message: 'Department ID is required for deletion.' });
        }

        const department = await getDepartmentById(departmentId);
        if (!department) {
            return res.status(404).json({ message: 'Department not found.' });
        }

        await deleteDepartmentById(departmentId);
        res.status(200).json({ message: 'Department deleted successfully.' });
    } catch (error) {
        next(error);
    }
};
