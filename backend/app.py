from flask import Flask, request, jsonify
from tensorflow.keras.models import load_model
import numpy as np
from PIL import Image
import io
from flask_cors import CORS
import os # Import os module to access environment variables

app = Flask(__name__)

# Configure CORS to explicitly allow requests from your Firebase Hosting frontend
# Replace 'https://potato-plant-disease-detection.web.app' with your exact frontend URL
CORS(app, resources={r"/predict": {"origins": "https://potato-plant-disease-detection.web.app/"}})

# --- Load Model and Handle Potential Errors ---
# This ensures the app doesn't crash if the model file is missing or corrupted.
try:
    model = load_model('model/potato_disease_model1.h5')
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
    # Set model to None so that /predict route can return an error if model loading fails
    model = None
    # No need to sys.exit(), let the app run and return a 500 error on /predict

# --- Define Global Constants ---
# IMPORTANT: These must match the exact dimensions your model was TRAINED with.
IMG_WIDTH, IMG_HEIGHT = 256, 256

# IMPORTANT: These class names must match the order the model was trained on.
CLASS_NAMES = ['Potato___Early_blight', 'Potato___Late_blight', 'Potato___healthy']


def prepare_image(image_bytes):
    # Open image, convert to RGB to handle various input formats (e.g., PNG with alpha, grayscale)
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    # Resize the image to the dimensions the model expects
    image = image.resize((IMG_WIDTH, IMG_HEIGHT))
    # Convert image to numpy array and normalize pixel values to [0, 1]
    image_array = np.array(image) / 255.0
    # Add an extra dimension for the batch (model expects input shape like (batch_size, height, width, channels))
    image_array = np.expand_dims(image_array, axis=0)
    return image_array

@app.route('/')
def home():
    # A simple route to confirm the server is running
    return "<h1>Potato Disease Detection API is running!</h1><p>Send a POST request to /predict with an image file.</p>"


@app.route('/predict', methods=['POST'])
def predict():
    # Check if the model was loaded successfully
    if model is None:
        return jsonify({'error': 'Model not loaded on server. Please check server logs.'}), 500

    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    try:
        img_bytes = file.read()
        # Prepare the image using the corrected dimensions
        img_processed = prepare_image(img_bytes)

        # Make prediction
        preds = model.predict(img_processed)
        # Get the index of the class with the highest probability
        predicted_class_index = np.argmax(preds)
        # Get the name of the predicted class
        predicted_class_name = CLASS_NAMES[predicted_class_index]
        # Get the confidence score for the predicted class
        confidence = float(np.max(preds))

        return jsonify({
            'disease': predicted_class_name,
            'confidence': confidence,
            'probabilities': preds[0].tolist() # Optional: send all class probabilities
        })

    except Exception as e:
        # Log the full error for debugging in the console
        print(f"Error during prediction: {e}")
        return jsonify({'error': f"An error occurred during prediction: {str(e)}"}), 500

if __name__ == '__main__':
    # Cloud Run will set the PORT environment variable
    # Use 8080 for local testing if PORT is not set
    port = int(os.environ.get('PORT', 8080)) # Get PORT from environment or default to 8080
    app.run(host='0.0.0.0', port=port, debug=False) # Set debug=False for production