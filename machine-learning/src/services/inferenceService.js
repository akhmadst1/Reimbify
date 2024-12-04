const tf = require('@tensorflow/tfjs-node');
const InputError = require('../exceptions/InputError');

async function predictClassification(model, image) {
    try {
        const tensor = tf.node
            .decodeJpeg(image)
            .resizeNearestNeighbor([224, 224])
            .expandDims()
            .toFloat()

        const classes = ['Cancer', 'Non-cancer'];

        // Prediksi dari model
        const prediction = model.predict(tensor);
        const score = await prediction.data();
        const confidenceScore = Math.max(...score) * 100;

        // Menentukan hasil berdasarkan confidence score
        let label;
        if (confidenceScore > 50) {
            label = classes[0]; // 'Cancer'
        } else {
            label = classes[1]; // 'Non-cancer'
        }

        let suggestion;

        if (label === 'Cancer') {
            suggestion = "Segera periksa ke dokter!"
        }

        if (label === 'Non-cancer') {
            suggestion = "Penyakit kanker tidak terdeteksi."
        }

        return { label, suggestion };
    } catch (error) {
        throw new InputError(`Terjadi kesalahan dalam melakukan prediksi`)
    }
}

module.exports = predictClassification;