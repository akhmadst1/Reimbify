import io
import os
import requests
import tempfile
import numpy as np
import tensorflow as tf
from flask import Flask, request, jsonify
from tensorflow.keras.preprocessing import image
import cv2  # OpenCV library

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

# Blur detection functions
def is_blur_laplacian(image, laplacian_threshold):
    image_gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    variance = cv2.Laplacian(image_gray, cv2.CV_64F).var()
    return True if variance < laplacian_threshold else False, variance

def is_blur_sobel(image, sobel_threshold):
    image_gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    sobel_x = cv2.Sobel(image_gray, cv2.CV_64F, 1, 0, ksize=3)
    sobel_y = cv2.Sobel(image_gray, cv2.CV_64F, 0, 1, ksize=3)
    sobel_magnitude = np.sqrt(sobel_x**2 + sobel_y**2)
    variance = sobel_magnitude.var()
    return True if variance < sobel_threshold else False, variance

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image part in the request'}), 400

        file = request.files['image']

        if file.filename == '':
            return jsonify({'error': 'No file selected for uploading'}), 400

        # Load image
        img = image.load_img(io.BytesIO(file.read()))
        img_array = np.array(img)

        # Blur detection
        laplacian_threshold = 100
        sobel_threshold = 500
        laplacian_status, laplacian_variance = is_blur_laplacian(img_array, laplacian_threshold)
        sobel_status, sobel_variance = is_blur_sobel(img_array, sobel_threshold)
        blurred = True if laplacian_status or sobel_status else False

        blur_result = {
            'blurred': blurred,
            'laplacian': {
                'variance': laplacian_variance,
                'threshold': laplacian_threshold,
                'status': laplacian_status
            },
            'sobel': {
                'variance': sobel_variance,
                'threshold': sobel_threshold,
                'status': sobel_status
            }
        }

        # Model prediction preprocessing
        img_preprocessed = load_and_preprocess_image(img)

        # Rotation model prediction
        rotation_prediction = rotation_model.predict(img_preprocessed)
        rotation_threshold = 0.0544
        rotated = True if (rotation_prediction < rotation_threshold) else False

        # Crop model prediction
        crop_prediction = crop_model.predict(img_preprocessed)
        crop_threshold = 0.998701572
        cropped = True if (crop_prediction < crop_threshold) else False
        
        valid = True if (not cropped and not rotated and not blurred) else False

        # Combined response
        result = {
            'valid': valid,
            'blur': blur_result,
            'crop': {
                'prediction': float(crop_prediction[0][0]),
                'threshold': crop_threshold,
                'cropped': cropped
            },
            'rotate': {
                'prediction': float(rotation_prediction[0][0]),
                'threshold': rotation_threshold,
                'rotated': rotated
            }
        }

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
