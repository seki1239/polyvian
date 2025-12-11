import React from 'react';
import { type Grade, Rating } from 'ts-fsrs';

interface RatingButtonsProps {
  onRate: (rating: Grade) => void;
}

const RatingButtons: React.FC<RatingButtonsProps> = ({ onRate }) => {
  const buttonStyle: React.CSSProperties = {
    padding: '10px 20px',
    margin: '5px',
    fontSize: '16px',
    cursor: 'pointer',
    borderRadius: '5px',
    border: '1px solid #ddd',
    backgroundColor: '#eee',
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
      <button style={buttonStyle} onClick={() => onRate(Rating.Again)}>
        Again
      </button>
      <button style={buttonStyle} onClick={() => onRate(Rating.Hard)}>
        Hard
      </button>
      <button style={buttonStyle} onClick={() => onRate(Rating.Good)}>
        Good
      </button>
      <button style={buttonStyle} onClick={() => onRate(Rating.Easy)}>
        Easy
      </button>
    </div>
  );
};

export default RatingButtons;