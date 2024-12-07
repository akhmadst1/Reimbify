import io
import os
import requests
import tempfile
import numpy as np
import tensorflow as tf
from flask import Flask, request, jsonify
from tensorflow.keras.preprocessing import image

app = Flask(__name__)

# Define image size for your model
IMAGE_SIZE = (224, 224)

# Function to download and load the model from the public URL
def load_model_from_url(model_url):
    response = requests.get(model_url)
    if response.status_code == 200:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.h5') as temp_model_file:
            temp_model_file.write(response.content)
            temp_model_path = temp_model_file.name

        model = tf.keras.models.load_model(temp_model_path)
        os.remove(temp_model_path)
        return model
    else:
        raise Exception(f"Failed to download the model file from GCS. Status code: {response.status_code}")

# URLs for the models
rotation_model_url = 'https://storage.googleapis.com/reimbify.appspot.com/models/rotation.h5'
crop_model_url = 'https://storage.googleapis.com/reimbify.appspot.com/models/crop.h5'

# Load models
rotation_model = load_model_from_url(rotation_model_url)
crop_model = load_model_from_url(crop_model_url)

# Preprocessing function
def load_and_preprocess_image(img):
    img = img.resize(IMAGE_SIZE)
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = img_array / 255.0
    return img_array

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image part in the request'}), 400

        file = request.files['image']

        if file.filename == '':
            return jsonify({'error': 'No file selected for uploading'}), 400

        img = image.load_img(io.BytesIO(file.read()))
        img_array = load_and_preprocess_image(img)

        # Rotation model prediction
        rotation_prediction = rotation_model.predict(img_array)
        rotation_class = (rotation_prediction < 0.0544).astype("int32")

        # Crop model prediction
        crop_prediction = crop_model.predict(img_array)
        crop_class = (crop_prediction < 0.998701572).astype("int32")

        # Combined response with separated objects
        result = {
            'valid': True if ((crop_class == 0) and (rotation_class == 0)) else False,
            'crop': {
                'prediction': float(crop_prediction[0][0]),  # Convert ndarray to float
                'threshold': 0.998701572,
                'cropped': True if crop_class == 1 else False
            },
            'rotate': {
                'prediction': float(rotation_prediction[0][0]),  # Convert ndarray to float
                'threshold': 0.0544,
                'rotated': True if rotation_class == 1 else False
            }
        }

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
