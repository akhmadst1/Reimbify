const pool = require('../config/pool'); // Import Cloud SQL connection pool
const { decrypt } = require('../utils/encryption');

// Create a receipt
exports.createReceipt = async (receipt) => {
    const query = `
        INSERT INTO receipt (requester_id, department_id, account_id, receipt_date, description, amount, request_date, status, receipt_image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const { requesterId, departmentId, accountId, receiptDate, description, amount, receiptImageUrl } = receipt;
    const requestDate = new Date(); // Set requestDate to current time

    try {
        await pool.query(query, [
            requesterId, departmentId, accountId, receiptDate, description, amount, requestDate, 'under_review', receiptImageUrl
        ]);
    } catch (err) {
        throw err;
    }
};

function formatReceipt(receipt) {
    return {
        receiptId: receipt.receipt_id,
        requester: {
            userId: receipt.user_id,
            userName: receipt.user_name,
            email: receipt.email
        },
        department: {
            departmentId: receipt.department_id,
            departmentName: receipt.department_name
        },
        account: {
            accountId: receipt.account_id,
            accountTitle: receipt.account_title,
            accountHolderName: receipt.account_holder_name,
            accountNumber: decrypt(receipt.account_number_encrypted),
            bank: {
                bankId: receipt.bank_id,
                bankName: receipt.bank_name
            }
        },
        receiptDate: receipt.receipt_date,
        description: receipt.description,
        amount: receipt.amount,
        requestDate: receipt.request_date,
        status: receipt.status,
        receiptImageUrl: receipt.receipt_image_url,
        approval: {
            admin: receipt.admin_id
                ? {
                    userId: receipt.admin_id,
                    userName: receipt.admin_name,
                    email: receipt.admin_email
                }
                : null,
            responseDate: receipt.response_date,
            transferImageUrl: receipt.transfer_image_url,
            responseDescription: receipt.response_description
        }
    };
}

exports.getReceipts = async ({ receiptId, userId, sorted, search, departmentId, status }) => {
    const conditions = [];
    const values = [];

    // Add conditions based on parameters
    if (receiptId) {
        conditions.push('r.receipt_id = ?');
        values.push(receiptId);
    }
    if (userId) {
        conditions.push('r.requester_id = ?');
        values.push(userId);
    }
    if (search && typeof search === 'string') {
        conditions.push('(LOWER(r.description) LIKE ? OR LOWER(u.user_name) LIKE ? OR LOWER(u.email) LIKE ?)');
        const searchTerm = `%${search.toLowerCase()}%`;
        values.push(searchTerm, searchTerm, searchTerm);
    }
    if (departmentId) {
        conditions.push('r.department_id = ?');
        values.push(departmentId);
    }
    if (status) {
        const statuses = status.split(',').map((s) => s.trim());
        conditions.push(`r.status IN (${statuses.map(() => '?').join(', ')})`);
        values.push(...statuses);
    }

    // Base query
    let query = `
        SELECT 
            r.*,
            u.user_id, u.user_name, u.email,
            d.department_id, d.department_name,
            ba.account_id, ba.account_title, ba.account_holder_name, ba.account_number_encrypted,
            b.bank_id, b.bank_name,
            admin.user_id AS admin_id, admin.user_name AS admin_name, admin.email AS admin_email,
            r.response_date, r.transfer_image_url, r.response_description
        FROM receipt r
        JOIN user u ON r.requester_id = u.user_id
        JOIN department d ON r.department_id = d.department_id
        JOIN bank_account ba ON r.account_id = ba.account_id
        JOIN bank b ON ba.bank_id = b.bank_id
        LEFT JOIN user admin ON r.admin_id = admin.user_id
    `;

    // Add WHERE clause if conditions exist
    if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Add sorting clause
    if (sorted && typeof sorted === 'string') {
        const [column, direction] = sorted.split(':');
        const allowedColumns = ['request_date', 'status', 'amount']; // Define allowed columns
        if (
            column &&
            allowedColumns.includes(column) &&
            direction &&
            ['asc', 'desc'].includes(direction.toLowerCase())
        ) {
            query += ` ORDER BY r.${column} ${direction.toUpperCase()}`;
        } else {
            query += ' ORDER BY r.request_date DESC'; // Default sorting
        }
    } else {
        query += ' ORDER BY r.request_date DESC'; // Default sorting
    }

    // Execute query
    const [rows] = await pool.query(query, values);
    return rows.map(formatReceipt);
};

exports.getTotalAmountByStatus = async (status) => {
    const placeholders = status.map(() => '?').join(', ');
    const query = `
        SELECT 
            status, 
            SUM(amount) AS totalAmount
        FROM receipt
        WHERE status IN (${placeholders})
        GROUP BY status
    `;

    try {
        const [rows] = await pool.query(query, status);
        return rows.reduce((acc, row) => {
            acc[row.status] = parseFloat(row.totalAmount) || 0; // Default to 0
            return acc;
        }, {});
    } catch (err) {
        throw err;
    }
};

exports.getTotalAmountMonthly = async ({ year, userId }) => {
    const conditions = [];
    const values = [];

    // Add filters
    conditions.push('YEAR(r.request_date) = ?');
    values.push(year);

    if (userId) {
        conditions.push('r.requester_id = ?');
        values.push(userId);
    }

    // Query to fetch monthly totals and breakdowns by status
    const query = `
        SELECT
            YEAR(r.request_date) AS year,
            MONTH(r.request_date) AS month,
            ${userId ? 'r.requester_id,' : ''} 
            r.status,
            SUM(r.amount) AS totalAmount
        FROM receipt r
        ${conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''}
        GROUP BY 
            YEAR(r.request_date), 
            MONTH(r.request_date),
            ${userId ? 'r.requester_id,' : ''} 
            r.status
        ORDER BY 
            YEAR(r.request_date), 
            MONTH(r.request_date),
            r.status
    `;

    try {
        const [rows] = await pool.query(query, values);

        // Transform rows into grouped structure with monthly totals
        const result = {};
        rows.forEach(row => {
            const key = `${row.year}-${row.month}`;
            if (!result[key]) {
                result[key] = {
                    year: row.year,
                    month: row.month,
                    ...(userId ? { userId: row.requester_id } : {}),
                    totalAmount: 0, // Initialize total amount
                    status: {}
                };
            }

            // Increment total amount for the month, converting to number
            result[key].totalAmount += parseFloat(row.totalAmount);

            // Add breakdown for the current status
            result[key].status[row.status] = parseFloat(row.totalAmount);
        });

        return { histories: Object.values(result) };
    } catch (err) {
        throw err;
    }
};

exports.getTotalReceipts = async ({ departmentId, userId, statusList }) => {
    let query = `
        SELECT 
            department.department_name,
            receipt.department_id,
            receipt.status,
            COUNT(*) AS total
        FROM
            receipt
        JOIN 
            department ON receipt.department_id = department.department_id
    `;

    const conditions = [];
    const params = [];

    // Apply filters if provided
    if (departmentId) {
        conditions.push('receipt.department_id = ?');
        params.push(departmentId);
    }

    if (userId) {
        conditions.push('receipt.requester_id = ?');
        params.push(userId);
    }

    if (statusList && statusList.length > 0) {
        conditions.push('receipt.status IN (?)');
        params.push(statusList);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    // Add grouping logic
    if (statusList && statusList.length === 1) {
        // Group by department when filtering by specific status
        query += ' GROUP BY receipt.department_id ORDER BY receipt.department_id;';
    } else {
        // Default grouping
        query += ' GROUP BY receipt.department_id, receipt.status ORDER BY receipt.department_id, receipt.status;';
    }

    try {
        const [rows] = await pool.query(query, params);

        if (statusList && statusList.length === 1) {
            // Return breakdown by department for specific status
            const histories = rows.map(row => ({
                departmentId: row.department_id,
                departmentName: row.department_name,
                total: parseInt(row.total, 10),
            }));
            return { histories };
        } else {
            // Return total counts grouped by status
            return rows.reduce((acc, row) => {
                if (!acc[row.status]) {
                    acc[row.status] = 0;
                }
                acc[row.status] += parseInt(row.total, 10);
                return acc;
            }, {
                under_review: 0,
                approved: 0,
                rejected: 0,
            });
        }
    } catch (err) {
        throw err;
    }
};

// Update receipt by ID
exports.updateReceipt = async (receiptId, updatedData) => {
    const query = `
        UPDATE receipt
        SET requester_id = ?, department_id = ?, account_id = ?, receipt_date = ?, description = ?, amount = ?, receipt_image_url = ?
        WHERE receipt_id = ?
    `;
    const { requesterId, departmentId, accountId, receiptDate, description, amount, receiptImageUrl } = updatedData;

    try {
        await pool.query(query, [
            requesterId, departmentId, accountId, receiptDate, description, amount, receiptImageUrl, receiptId
        ]);
    } catch (err) {
        throw err;
    }
};

// Delete receipt by ID
exports.deleteReceiptById = async (receiptId) => {
    const query = `
        DELETE FROM receipt WHERE receipt_id = ?
    `;
    try {
        await pool.query(query, [receiptId]);
    } catch (err) {
        throw err;
    }
};

// Update receipt approval or rejection
exports.updateReceiptApproval = async (receiptId, { status, adminId, responseDate, responseDescription, transferImageUrl }) => {
    const query = `
        UPDATE receipt
        SET 
            status = ?, 
            admin_id = ?, 
            response_date = ?, 
            response_description = ?, 
            transfer_image_url = ?
        WHERE receipt_id = ?
    `;

    try {
        await pool.query(query, [status, adminId, responseDate, responseDescription, transferImageUrl, receiptId]);
    } catch (err) {
        throw err;
    }
};
