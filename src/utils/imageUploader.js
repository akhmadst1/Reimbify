'use strict'
const { Storage } = require('@google-cloud/storage')
const path = require('path');
const { getUserById } = require('../models/userModel');
const { getReceiptById } = require('../models/receiptModel');
require('dotenv').config();

const pathKey = path.resolve('./serviceaccountkey.json')

const gcs = new Storage({
    projectId: process.env.GCLOUD_PROJECT,
    keyFilename: pathKey
})

const bucketName = process.env.GCLOUD_BUCKET
const bucket = gcs.bucket(bucketName)

function getPublicUrl(filename) {
    return 'https://storage.googleapis.com/' + bucketName + '/' + filename;
}

let ImgUpload = {}

ImgUpload.uploadToGcsProfileImages = (req, res, next) => {
    if (!req.file) return next()

    const { userId } = req.query;

    const gcsname = 'profile_images/' + userId
    const file = bucket.file(gcsname)

    const stream = file.createWriteStream({
        metadata: {
            contentType: req.file.mimetype
        }
    })

    stream.on('error', (err) => {
        req.file.cloudStorageError = err
        next(err)
    })

    stream.on('finish', () => {
        req.file.cloudStorageObject = gcsname
        req.file.cloudStoragePublicUrl = getPublicUrl(gcsname)
        next()
    })

    stream.end(req.file.buffer)
}

ImgUpload.uploadToGcsReceipts = async (req, res, next) => {
    if (!req.file) return next();

    const { userId } = req.query;
    if (!userId ) {
        return res.status(400).json({ message: 'userId are required.' });
    }

    const user = await getUserById(userId);
    if (!user) {
        return res.status(404).json({ message: 'User not found.' });
    }

    const department = user.department;

    // Get current date components (year, month, day)
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Ensures month is 2 digits
    const day = currentDate.getDate().toString().padStart(2, '0'); // Ensures day is 2 digits

    // Create a unique folder structure and file name
    const gcsname = `receipts/${department.departmentName}/${year}/${month}/${day}/${userId}/${req.file.originalname}`;
    const file = bucket.file(gcsname);

    const stream = file.createWriteStream({
        metadata: {
            contentType: req.file.mimetype,
        },
    });

    stream.on('error', (err) => {
        req.file.cloudStorageError = err;
        next(err);
    });

    stream.on('finish', () => {
        req.file.cloudStorageObject = gcsname;
        req.file.cloudStoragePublicUrl = getPublicUrl(gcsname);
        next();
    });

    stream.end(req.file.buffer);
};

ImgUpload.uploadToGcsReimbursementProof = async (req, res, next) => {
    if (!req.file) return next();

    const { receiptId } = req.query;
    if (!receiptId) {
        return res.status(400).json({ message: 'receiptId are required.' });
    }

    const receipt = await getReceiptById(receiptId);
    if (!receipt) {
        return res.status(404).json({ message: 'Receipt not found.' });
    }

    const trimmed_url = receipt.receiptImageUrl.split("receipts/")[1]
    const gcsname = 'receipts/' + trimmed_url + '_reimbursement_proof';
    const file = bucket.file(gcsname);

    const stream = file.createWriteStream({
        metadata: {
            contentType: req.file.mimetype,
        },
    });

    stream.on('error', (err) => {
        req.file.cloudStorageError = err;
        next(err);
    });

    stream.on('finish', () => {
        req.file.cloudStorageObject = gcsname;
        req.file.cloudStoragePublicUrl = getPublicUrl(gcsname);
        next();
    });

    stream.end(req.file.buffer);
};

module.exports = {
    ImgUpload,
    bucket,
};