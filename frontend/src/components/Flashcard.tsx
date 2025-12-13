import React from 'react';
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
  onShowSimilarWords: (cards: ICard[]) => void; // 新しいプロップを追加
  cardState: string | ICard['state']; // cardStateを追加
}
 
const Flashcard: React.FC<FlashcardProps> = ({ word, definition, sentence, similarCards, isInterleaving, isFlipped, onFlip, onShowSimilarWords, cardState }) => {

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
    if (similarCards) {
      onShowSimilarWords(similarCards); // 親の関数を実行
    }
  };

  return (
    <div className={`flashcard-container ${isFlipped ? 'flipped' : ''}`} onClick={handleCardClick}>
      <div className="flashcard-front">
        <span className="card-status-badge">{cardState}</span> {/* ステータスバッジ */}
        <p className="flashcard-word-front">{word}</p>
        <button className="speak-icon-button" onClick={handleSpeakClick}>
          🔊
        </button>
        <p className="tap-hint">Tap to flip</p> {/* 操作ヒント */}
      </div>
      <div className="flashcard-back">
        <p className="flashcard-word-back">{word}</p>
        <p className="flashcard-definition-back">{definition}</p>
        {sentence && <p className="flashcard-sentence-back">例: {sentence}</p>}
        {similarCards && similarCards.length > 0 && (
          <button className="flashcard-compare-button" onClick={handleSimilarWordsClick}>
            ⚠️ 類似語あり ({similarCards.length})
          </button>
        )}
      </div>
    </div>
  );
};

export default Flashcard;