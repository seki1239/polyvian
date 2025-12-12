import React, { useState } from 'react';
import { audioController } from '../utils/AudioController';
import type { ICard } from '../db/db'; // ICardをdb.tsからインポート

interface FlashcardProps {
  word: string;
  definition: string;
  sentence: string;
  similarCards?: ICard[];
  isInterleaving?: boolean;
  isFlipped: boolean;
  onFlip: () => void;
}

const Flashcard: React.FC<FlashcardProps> = ({ word, definition, sentence, similarCards, isInterleaving, isFlipped, onFlip }) => {
  const [showModal, setShowModal] = useState(false);

  const handleCardClick = () => {
    onFlip();
  };

  const handleSpeakClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await audioController.ensureAudioContextActive();
    audioController.speak(word);
  };

  const handleSimilarWordsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <div className={`flashcard-container ${isFlipped ? 'flipped' : ''}`} onClick={handleCardClick}>
      <div className="flashcard-front">
        <p className="flashcard-word-front">{word}</p>
        <button className="speak-icon-button" onClick={handleSpeakClick}>
          🔊
        </button>
      </div>
      <div className="flashcard-back">
        <p className="flashcard-word-back">{word}</p>
        <p className="flashcard-definition-back">{definition}</p>
        {sentence && <p className="flashcard-sentence-back">例: {sentence}</p>}
        {similarCards && similarCards.length > 0 && (
          <button className="flashcard-compare-button" onClick={handleSimilarWordsClick}>
            ⚠️ 類似語: {similarCards.map(card => card.word).join(', ')} (タップで確認)
          </button>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>類似語詳細</h3>
              {similarCards?.map(card => (
                <div key={card.id} className="similar-card-detail">
                  <h4>{card.word}</h4>
                  <p><strong>意味:</strong> {card.definition}</p>
                  <p><strong>例文:</strong> {card.sentence}</p>
                </div>
              ))}
              <button className="modal-close-button" onClick={handleCloseModal}>閉じる</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Flashcard;