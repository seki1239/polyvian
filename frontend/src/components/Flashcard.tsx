import React, { useState } from 'react';

interface FlashcardProps {
  word: string;
  meaning: string;
}

const Flashcard: React.FC<FlashcardProps> = ({ word, meaning }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
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
    backgroundColor: '#f9f9f9',
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
      </div>
      <div style={{ ...contentStyle, transform: 'rotateY(180deg)' }}>
        {meaning}
      </div>
    </div>
  );
};

export default Flashcard;