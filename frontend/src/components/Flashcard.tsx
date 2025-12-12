import React, { useState } from 'react';
import { audioController } from '../utils/AudioController';

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
    e.stopPropagation();
    audioController.speak(word);
  };

  return (
    <div className={`flashcard-container ${isFlipped ? 'flipped' : ''}`} onClick={handleCardClick}>
      <div className="flashcard-front">
        <p>{word}</p>
        <button className="speak-button" onClick={handleSpeakClick}>
          🔊
        </button>
      </div>
      <div className="flashcard-back">
        <p>{meaning}</p>
      </div>
    </div>
  );
};

export default Flashcard;