import React from 'react';
import { audioController } from '../utils/AudioController';

interface FlashcardProps {
  word: string;
  definition: string;
  sentence: string;
  similarWords?: string[]; // 類似語の単語リストを追加
  isInterleaving?: boolean; // インターリービングフラグを追加
  isFlipped: boolean;
  onFlip: () => void;
}

const Flashcard: React.FC<FlashcardProps> = ({ word, definition, sentence, similarWords, isInterleaving, isFlipped, onFlip }) => {
  const handleCardClick = () => {
    onFlip();
  };

  const handleSpeakClick = async (e: React.MouseEvent) => { // asyncを追加
    e.stopPropagation(); // カードのフリップイベントが発火しないようにする
    // iOSでのAudioContextをアクティブに保つ
    await audioController.ensureAudioContextActive();
    audioController.speak(word);
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
        {/* 例文の翻訳があればここに表示 */}
        {similarWords && similarWords.length > 0 && (
          <div className="flashcard-compare-area">
            <p>⚠️ Compare with: {similarWords.join(', ')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Flashcard;