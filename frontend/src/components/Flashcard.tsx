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
  cardState: ICard['state']; // cardStateを追加 (数値型に限定)
}
 
const Flashcard: React.FC<FlashcardProps> = ({ word, definition, sentence, similarCards, isInterleaving, isFlipped, onFlip, onShowSimilarWords, cardState }) => {

  // cardStateの数値に対応するラベルを返すヘルパー関数
  const getLabelForState = (state: ICard['state']) => {
    switch (state) {
      case 0: return "New";
      case 1: return "Learning";
      case 2: return "Review";
      case 3: return "Relearning";
      default: return "Unknown";
    }
  };

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
        <div className="card-header">
          <span className="card-status-badge">{getLabelForState(cardState)}</span>
          <button className="speak-icon-button" onClick={handleSpeakClick}>🔊</button>
        </div>
        <div className="card-content">
          <p className="flashcard-word-front">{word}</p>
        </div>
        <div className="card-footer">
          <p className="tap-hint">Tap to flip</p>
        </div>
      </div>
      <div className="flashcard-back">
        <div className="card-header">
          {/* 裏面ヘッダーには現状コンテンツがないため空だが、将来的な拡張のために残す */}
        </div>
        <div className="card-content">
          <p className="flashcard-word-back">{word}</p>
          <p className="flashcard-definition-back">{definition}</p>
          {sentence && <p className="flashcard-sentence-back">例: {sentence}</p>}
        </div>
        <div className="card-footer">
          {similarCards && similarCards.length > 0 && (
            <button className="flashcard-similar-button" onClick={handleSimilarWordsClick}>
              類似語 ({similarCards.length})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Flashcard;