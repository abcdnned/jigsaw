import React, { useEffect, useState } from 'react';
import { initGame } from './game';
import './GamePage.css'; // Make sure to create this CSS file

function GamePage({ imageFile, resolution, onExit, onRestart }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (imageFile instanceof File) {
      const url = URL.createObjectURL(imageFile);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (typeof imageFile === 'string') {
      setImageUrl(imageFile);
    }
  }, [imageFile]);

  useEffect(() => {
    if (imageUrl) {
      const img = new Image();
      img.onload = () => {
        initGame(imageUrl, resolution);
        setImageError(false);
      };
      img.onerror = () => {
        setImageError(true);
      };
      img.src = imageUrl;
    }
  }, [imageUrl, resolution]);

  return (
    <div className="game-page">
      <nav className="game-nav">
        <button onClick={onRestart} className="nav-button">Restart</button>
        <button onClick={onExit} className="nav-button">Exit</button>
      </nav>
      <div className="canvas-container">
        {imageError ? (
          <div className="error-message">
            Error loading image. Please try again with a different image.
          </div>
        ) : (
          <div id="game-container"></div>
        )}
      </div>
    </div>
  );
}

export default GamePage;