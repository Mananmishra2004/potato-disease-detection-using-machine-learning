# Use an official Python runtime as a parent image
FROM python:3.9-slim-buster

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the working directory
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire Flask application code (including the model folder)
COPY . .

# Ensure the model directory exists relative to /app
# And ensure the model is actually there
RUN ls -la /app/model/potato_disease_model.h5 || echo "Model file not found during build!"

# Expose the port that the application will listen on
# Cloud Run requires you to listen on the port specified by the PORT environment variable
ENV PORT 8080
EXPOSE ${PORT}

# Run the application using Gunicorn, a production-ready WSGI server
# CMD ["python", "app.py"] is okay for development, but Gunicorn is better for prod
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "app:app"]
# Explanation:
# gunicorn: the server
# --bind 0.0.0.0:8080: listens on all interfaces on port 8080 (Cloud Run's default)
# app:app: points to the 'app' Flask instance within the 'app.py' file