import React from 'react';
import { type Grade, Rating } from 'ts-fsrs';

interface RatingButtonsProps {
  onRate: (rating: Grade) => void;
}

const RatingButtons: React.FC<RatingButtonsProps> = ({ onRate }) => {
  return (
    <div className="rating-buttons-container">
      <button className="rating-button easy" onClick={() => onRate(Rating.Easy)}>
        Easy
      </button>
      <button className="rating-button good" onClick={() => onRate(Rating.Good)}>
        Good
      </button>
      <button className="rating-button hard" onClick={() => onRate(Rating.Hard)}>
        Hard
      </button>
      <button className="rating-button again" onClick={() => onRate(Rating.Again)}>
        Again
      </button>
    </div>
  );
};

export default RatingButtons;