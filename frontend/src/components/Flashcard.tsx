import React, { useState } from 'react';
import { audioController } from '../utils/AudioController'; // AudioControllerをインポート

interface FlashcardProps {
  word: string;
  meaning: string;
}

const Flashcard: React.FC<FlashcardProps> = ({ word, meaning }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  const handleSpeakClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // カードのフリップを防ぐ
    audioController.speak(word);
  };

  const cardStyle: React.CSSProperties = {
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '20px',
    width: '300px',
    height: '200px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '24px',
    cursor: 'pointer',
    backgroundColor: '#ffffff', // 白を明示的に指定
    color: '#333333', // 濃いグレー/黒を明示的に指定
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'transform 0.6s',
    transformStyle: 'preserve-3d',
  };

  const contentStyle: React.CSSProperties = {
    backfaceVisibility: 'hidden',
    position: 'absolute',
  };

  const flippedStyle: React.CSSProperties = {
    transform: 'rotateY(180deg)',
  };

  return (
    <div
      style={{ ...cardStyle, ...(isFlipped ? flippedStyle : {}) }}
      onClick={handleCardClick}
    >
      <div style={{ ...contentStyle, transform: 'rotateY(0deg)' }}>
        {word}
        <button
          onClick={handleSpeakClick}
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#333333',
          }}
        >
          🔊
        </button>
      </div>
      <div style={{ ...contentStyle, transform: 'rotateY(180deg)' }}>
        {meaning}
      </div>
    </div>
  );
};

export default Flashcard;