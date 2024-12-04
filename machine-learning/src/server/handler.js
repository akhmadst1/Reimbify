const predictClassification = require('../services/inferenceService');
const crypto = require('crypto');
const storeData = require('../services/storeData');
const getHistory = require('../services/getHistory');

async function postPredictHandler(request, h) {
    const { image } = request.payload;
    const { model } = request.server.app;

    const { label, suggestion } = await predictClassification(model, image);
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const data = {
        id,
        result: label,
        suggestion,
        createdAt,
    };

    await storeData(id, data);

    return h.response({
        status: 'success',
        message: 'Model is predicted successfully',
        data,
    }).code(201);
}

async function getHistoryHandler(request, h) {
    try {
        const history = await getHistory();

        return h.response({
            status: 'success',
            data: history,
        }).code(200);
    } catch (error) {
        console.error(error);
        return h.response({
            status: 'fail',
            message: 'Failed to retrieve history',
        }).code(500);
    }
}

// Export both handlers as an object
module.exports = { postPredictHandler, getHistoryHandler };
