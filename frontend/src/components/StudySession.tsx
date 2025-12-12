import React, { useState, useEffect, useCallback } from 'react';
import { db, type ICard } from '../db/db';
import { fsrs, type Card as FsrsCard, type Grade, State } from 'ts-fsrs';
import Flashcard from './Flashcard';
import RatingButtons from './RatingButtons';
import { audioController } from '../utils/AudioController';
import DebugPanel from './DebugPanel';

const StudySession: React.FC = () => {
  const [currentCard, setCurrentCard] = useState<ICard | undefined>(undefined);
  const [queue, setQueue] = useState<ICard[]>([]);// 未学習・復習対象のカードキュー
  const [isCardFlipped, setIsCardFlipped] = useState(false); // カードが裏返っているかどうかの状態
  const [similarWords, setSimilarWords] = useState<string[]>([]); // 類似語の単語リスト

  // カードの単語を読み上げる関数
  const speakWord = useCallback((word: string) => {
    audioController.speak(word).catch(error => console.error("音声再生エラー:", error));
  }, []);

  // 今日の学習対象カードをロード
  const loadCards = useCallback(async () => {
    const now = new Date();
    const userId = 1;

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const cardsDueTodayOrNew = await db.cards
      .where('user_id')
      .equals(userId)
      .filter(card => card.due_date.getTime() <= today.getTime() || card.state === State.New)
      .toArray();

    console.log("取得したカード:", cardsDueTodayOrNew);
    let studyQueue: ICard[] = [];
    const processedCardIds = new Set<number>();

    // Step 1: ベース取得とシャッフル
    const shuffledBaseCards = cardsDueTodayOrNew.sort(() => Math.random() - 0.5);

    // Step 2: 干渉注入 (Interference Injection)
    for (const card of shuffledBaseCards) {
      if (processedCardIds.has(card.id!)) {
        continue;
      }
      studyQueue.push(card);
      processedCardIds.add(card.id!);

      if (card.similar_ids && card.similar_ids.length > 0) {
        // 類似語がまだキューに含まれていないものを取得
        const similarCardIdsToFetch = card.similar_ids.filter(
          (similarId) => !processedCardIds.has(similarId)
        );

        if (similarCardIdsToFetch.length > 0) {
          const similarCards = await db.cards.bulkGet(similarCardIdsToFetch);
          const validSimilarCards = similarCards.filter(Boolean) as ICard[];

          for (const similarCard of validSimilarCards) {
            // 類似語カードにフラグを設定
            const interleavedCard: ICard = { ...similarCard, isInterleaving: true };

            // 挿入位置を決定（直後または2〜3枚後）
            // 簡単のため、ここでは直後に挿入する
            const insertIndex = studyQueue.length;
            studyQueue.splice(insertIndex, 0, interleavedCard);
            processedCardIds.add(interleavedCard.id!);
          }
        }
      }
    }

    // Step 3: セッション状態への保存
    setQueue(studyQueue);
    setCurrentCard(studyQueue[0]);
    setIsCardFlipped(false); // 新しいカードをロードしたら表面にリセット
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  // currentCardがセットされたら自動で読み上げ
  useEffect(() => {
    if (currentCard && !isCardFlipped) { // カードが表面の時のみ読み上げ
      speakWord(currentCard.word);
    }
  }, [currentCard, isCardFlipped, speakWord]); // isCardFlippedも依存配列に追加

  // currentCardにsimilar_idsがある場合、類似語の単語を取得
  useEffect(() => {
    const fetchSimilarWords = async () => {
      if (currentCard && currentCard.similar_ids && currentCard.similar_ids.length > 0) {
        const similarCardDetails = await db.cards.bulkGet(currentCard.similar_ids);
        const fetchedSimilarWords = (similarCardDetails.filter(Boolean) as ICard[]).map(card => card.word);
        setSimilarWords(fetchedSimilarWords);
      } else {
        setSimilarWords([]);
      }
    };
    fetchSimilarWords();
  }, [currentCard]);

  const handleRate = async (rating: Grade) => {
    if (!currentCard) return;

    const f = fsrs();

    const fsrsCard: FsrsCard = {
      due: currentCard.due_date,
      stability: currentCard.stability,
      difficulty: currentCard.difficulty,
      elapsed_days: currentCard.elapsed_days,
      scheduled_days: currentCard.scheduled_days,
      learning_steps: currentCard.learning_steps,
      reps: currentCard.reps,
      lapses: currentCard.lapses,
      state: currentCard.state as State,
      last_review: currentCard.last_review,
    };

    const now = new Date();

    const newCardState = f.repeat(
      fsrsCard,
      now,
    )[rating];

    await db.cards.update(currentCard.id!, {
      due_date: newCardState.card.due,
      stability: newCardState.card.stability,
      difficulty: newCardState.card.difficulty,
      elapsed_days: newCardState.card.elapsed_days,
      scheduled_days: newCardState.card.scheduled_days,
      reps: newCardState.card.reps,
      lapses: newCardState.card.lapses,
      state: newCardState.card.state as ICard['state'],
      last_review: now,
      updated_at: now,
      sync_status: 'pending',
    });

    await db.review_logs.add({
      card_id: currentCard.id!,
      user_id: currentCard.user_id,
      review_date: now,
      rating: rating,
      elapsed_days: newCardState.log.elapsed_days,
      scheduled_days: newCardState.log.scheduled_days,
      state: newCardState.log.state as ICard['state'],
      due_date: newCardState.log.due,
      sync_status: 'pending',
    });

    const nextQueue = queue.slice(1);
    setQueue(nextQueue);
    setIsCardFlipped(false);
    setCurrentCard(nextQueue[0]);
  };

  const handleFlip = () => {
    setIsCardFlipped(!isCardFlipped);
    // カードが裏返ったら、再度単語を読み上げないように、speakWordはuseEffectで制御
  };

  const handleResetAndSeedDB = async () => {
    window.location.reload();
  };

  if (!currentCard) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '20px' }}>
        <p>カードがありません</p>
        <button
          onClick={handleResetAndSeedDB}
          style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '15px 25px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '18px',
            marginTop: '20px',
          }}
        >
          初期データを投入する
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px' }}>
      <Flashcard
        key={currentCard.id}
        word={currentCard.word}
        definition={currentCard.definition}
        sentence={currentCard.sentence}
        similarWords={similarWords} // similarWordsを渡す
        isInterleaving={currentCard.isInterleaving} // isInterleavingを渡す
        isFlipped={isCardFlipped}
        onFlip={handleFlip}
      />
      {isCardFlipped && <RatingButtons onRate={handleRate} />}
      <DebugPanel /> {/* DebugPanelをStudySessionの直下に配置 */}
    </div>
  );
};

export default StudySession;