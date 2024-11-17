'use strict'
const {Storage} = require('@google-cloud/storage')
const path = require('path');
require('dotenv').config();

const pathKey = path.resolve('../../serviceaccountkey.json')

const gcs = new Storage({
    projectId: process.env.GCLOUD_PROJECT,
    keyFilename: pathKey
})

const bucketName = process.env.GCLOUD_BUCKET
const bucket = gcs.bucket(bucketName)

function getPublicUrl(filename) {
    return 'https://storage.googleapis.com/' + bucketName + '/' + filename;
}

let ImageUploader = {}

/**
 * Uploads file to GCS in a structured way.
 * @param {Object} req - The request object containing the file.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @param {string} type - The type of the file, e.g., 'profile image' or 'notes'.
 * @param {string} userId - The ID of the user (required if type is 'notes').
 */
ImageUploader.uploadToGcs = (req, res, next, type, userId) => {
    if (!req.file) return next();

    // Validate type and userId
    if (type !== 'profile' && type !== 'notes') {
        return next(new Error('Invalid type specified.'));
    }
    if (type === 'notes' && !userId) {
        return next(new Error('User ID is required for notes.'));
    }

    // Construct the folder path based on type and userId
    const folderPath = type === 'profile' 
        ? 'profile_images' 
        : `reimbursement_notes/${userId}`;
    const timestamp = Date.now(); // Unique timestamp for the filename
    const originalName = path.parse(req.file.originalname).name;
    const fileExtension = path.extname(req.file.originalname);

    // File path within GCS
    const gcsname = `${folderPath}/${originalName}-${timestamp}${fileExtension}`;
    const file = bucket.file(gcsname);

    const stream = file.createWriteStream({
        metadata: {
            contentType: req.file.mimetype
        }
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
}

module.exports = ImageUploader;
