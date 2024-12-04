require('dotenv').config();

const Hapi = require('@hapi/hapi');
const routes = require('../server/routes');
const loadModel = require('../services/loadModel');
const InputError = require('../exceptions/InputError');

(async () => {
    const server = Hapi.server({
        port: process.env.PORT || 8080,
        host: '0.0.0.0',
        routes: {
            cors: {
                origin: ['*'],
            },
            payload: {
                maxBytes: 1000000, // Membatasi ukuran payload menjadi 1MB
            },
        },
    });

    const model = await loadModel();
    server.app.model = model;

    server.route(routes);

    // Middleware untuk menangani error global
    server.ext('onPreResponse', function (request, h) {
        const response = request.response;

        // Penanganan khusus untuk InputError
        if (response instanceof InputError) {
            const newResponse = h.response({
                status: 'fail',
                message: response.message,
            });
            newResponse.code(response.statusCode);
            return newResponse;
        }

        // Penanganan kesalahan payload yang besar
        if (response.isBoom && response.output.statusCode === 413) { // 413 = Payload Too Large
            const newResponse = h.response({
                status: 'fail',
                message: 'Payload content length greater than maximum allowed: 1000000',
            });
            newResponse.code(413);
            return newResponse;
        }

        // Penanganan error lainnya
        if (response.isBoom) {
            const newResponse = h.response({
                status: 'fail',
                message: response.message,
            });
            newResponse.code(response.output.statusCode);
            return newResponse;
        }

        return h.continue;
    });

    await server.start();
    console.log(`Server start at: ${server.info.uri}`);
})();
