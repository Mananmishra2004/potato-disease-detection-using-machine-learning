import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // new

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Start camera
  const startCamera = async () => {
    setResult('');
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setStreaming(true);
          };
        }
      } catch (err) {
        alert('Error accessing camera: ' + err.message);
      }
    } else {
      alert('Camera API not supported by your browser');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setStreaming(false);
    }
  };

  // Switch camera button handler
  const switchCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
    stopCamera();
  };

  // When facingMode changes, auto start camera again
  useEffect(() => {
    if (streaming) {
      startCamera();
    }
    // eslint-disable-next-line
  }, [facingMode]);

  // Capture frame from video to canvas and convert to file blob
  const capturePhoto = () => {
    if (!streaming) return;
    const width = videoRef.current.videoWidth;
    const height = videoRef.current.videoHeight;
    canvasRef.current.width = width;
    canvasRef.current.height = height;
    const ctx = canvasRef.current.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, width, height);

    canvasRef.current.toBlob((blob) => {
      const imageFile = new File([blob], 'captured.png', { type: 'image/png' });
      setFile(imageFile);
    }, 'image/png');
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult('');
      stopCamera();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please upload or capture an image first.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(
        'http://localhost:8080/predict',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      const { disease, confidence } = response.data;
      setResult(`Detected: ${disease} (Confidence: ${(confidence * 100).toFixed(2)}%)`);
    } catch (error) {
      setResult('Error: ' + (error.response?.data?.error || error.message));
    }
    setLoading(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  // Styles
  const appStyle = {
    minHeight: '100vh',
    padding: '30px 20px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: '#ffffff',
    backgroundImage: `url('/img2.jpg')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    textAlign: 'center',
    textShadow: '0 2px 4px rgba(0,0,0,0.8)',
  };

  const buttonStylePrimary = {
    marginTop: 20,
    padding: '12px 25px',
    fontSize: 18,
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '0 4px 8px rgba(39, 174, 96, 0.4)',
    transition: 'background-color 0.3s ease',
  };

  const buttonStyleSecondary = {
    padding: '10px 20px',
    fontSize: 16,
    backgroundColor: '#2980b9',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '0 3px 7px rgba(41, 128, 185, 0.4)',
    transition: 'background-color 0.3s ease',
    marginRight: 10,
  };

  const buttonStyleDanger = {
    padding: '10px 20px',
    fontSize: 16,
    backgroundColor: '#c0392b',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '0 3px 7px rgba(192, 57, 43, 0.4)',
    transition: 'background-color 0.3s ease',
  };

  const hoverEffect = (e) => {
    e.target.style.filter = 'brightness(1.1)';
  };

  const hoverOut = (e) => {
    e.target.style.filter = 'brightness(1)';
  };

  return (
    <div style={appStyle}>
      <h1>Potato Disease Detection</h1>

      {/* File upload */}
      <div style={{ marginTop: 20 }}>
        <p>Upload an image of a potato leaf:</p>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ marginBottom: 20, borderRadius: 6 }}
        />
      </div>

      {/* Camera capture */}
      <div style={{ marginTop: 30 }}>
        <button
          onClick={startCamera}
          disabled={streaming}
          style={buttonStyleSecondary}
          onMouseEnter={hoverEffect}
          onMouseLeave={hoverOut}
        >
          Open Camera
        </button>

        {streaming && (
          <>
            <button
              onClick={switchCamera}
              style={buttonStyleSecondary}
              onMouseEnter={hoverEffect}
              onMouseLeave={hoverOut}
            >
              Switch Camera
            </button>

            <button
              onClick={capturePhoto}
              style={buttonStylePrimary}
              onMouseEnter={hoverEffect}
              onMouseLeave={hoverOut}
            >
              Capture Photo
            </button>

            <button
              onClick={stopCamera}
              style={buttonStyleDanger}
              onMouseEnter={hoverEffect}
              onMouseLeave={hoverOut}
            >
              Close Camera
            </button>
          </>
        )}

        <div style={{ marginTop: 20 }}>
          <video
            ref={videoRef}
            style={{
              display: streaming ? 'block' : 'none',
              width: '100%',
              maxWidth: 400,
              borderRadius: 12,
              border: '2px solid #ffffff',
            }}
            muted
          />
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {file && (
        <div style={{ marginTop: 20 }}>
          <h3 style={{ color: '#f1f1f1' }}>Image Preview:</h3>
          <img
            src={URL.createObjectURL(file)}
            alt="Preview"
            style={{
              maxWidth: '300px',
              maxHeight: '300px',
              border: '2px solid #ffffff',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            }}
          />
          <p style={{ fontSize: 14, color: '#ddd' }}>File ready: {file.name}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ marginTop: 30 }}>
        <button
          type="submit"
          disabled={loading || !file}
          style={buttonStylePrimary}
          onMouseEnter={hoverEffect}
          onMouseLeave={hoverOut}
        >
          {loading ? 'Analyzing...' : 'Detect Disease'}
        </button>
      </form>

      {result && (
        <div
          style={{
            marginTop: 30,
            fontSize: 22,
            fontWeight: 'bold',
            color: '#fff',
            padding: '15px',
            backgroundColor: 'rgba(41, 128, 185, 0.8)',
            borderRadius: '12px',
            border: '2px solid #cce0ff',
            boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
          }}
        >
          Result: {result}
        </div>
      )}
    </div>
  );
}

export default App;
