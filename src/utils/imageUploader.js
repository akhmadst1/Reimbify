'use strict'
const { Storage } = require('@google-cloud/storage')
const path = require('path');
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

ImgUpload.uploadToGcsReceipts = (req, res, next) => {
    if (!req.file) return next()

    const { userId } = req.query;

    const gcsname = 'receipts/' + userId + '/' + req.file.originalname;
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

module.exports = {
    ImgUpload,
    bucket,
};