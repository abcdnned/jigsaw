import React, { useState } from 'react';
import './App.css';
import GamePage from './GamePage';

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [resolution, setResolution] = useState(2);

  const startGame = () => {
    if (imageFile) {
      setGameStarted(true);
    } else {
      alert('Please upload an image first!');
    }
  };

  const exitGame = () => {
    setGameStarted(false);
  };

  // StartPage component
  function StartPage({ onStartGame }) {
    const handleImageUpload = (event) => {
      const file = event.target.files[0];
      setImageFile(file);
    };

    const handleResolutionChange = (event) => {
      setResolution(parseInt(event.target.value));
    };

    return (
      <>
        <h1 className="game-title">Jigsaw Puzzle Game</h1>
        <div className="game-setup">
          <div className="upload-container">
            <label htmlFor="file-upload" className="custom-file-upload">
              🖼️ Choose Image
            </label>
            <input id="file-upload" type="file" accept="image/*" onChange={handleImageUpload} />
            {imageFile && <span className="file-name">{imageFile.name}</span>}
          </div>
          <div className="resolution-container">
            <label htmlFor="resolution">Puzzle Size: </label>
            <select id="resolution" value={resolution} onChange={handleResolutionChange} className="resolution-select">
              <option value="2">2x2 (Easy)</option>
              <option value="3">3x3 (Medium)</option>
              <option value="4">4x4 (Hard)</option>
              <option value="5">5x5 (Expert)</option>
              <option value="6">6x6 (Master)</option>
            </select>
          </div>
          <button onClick={startGame} className="start-button">Start Game</button>
        </div>
      </>
    );
  }

  return (
    <div className="App">
      <div className="game-background">
        <div className="game-content">
          {!gameStarted ? (
            <StartPage onStartGame={startGame} />
          ) : (
            <GamePage 
              imageFile={imageFile} 
              resolution={resolution} 
              onExit={exitGame}
              onRestart={() => {
                setGameStarted(false);
                setTimeout(() => setGameStarted(true), 0);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
