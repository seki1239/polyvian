import React, { useState, useEffect, useCallback } from 'react';
import { db, type ICard } from '../db/db';
import { fsrs, type Card as FsrsCard, type Grade, State } from 'ts-fsrs';
import Flashcard from './Flashcard';
import RatingButtons from './RatingButtons';
import { audioController } from '../utils/AudioController'; // AudioControllerをインポート
import DebugPanel from './DebugPanel'; // DebugPanelをインポート

const StudySession: React.FC = () => {
  const [currentCard, setCurrentCard] = useState<ICard | undefined>(undefined);
  const [queue, setQueue] = useState<ICard[]>([]);
  const [isFlipped, setIsFlipped] = useState(false);

  // カードの単語を読み上げる関数
  const speakWord = useCallback((word: string) => {
    audioController.speak(word).catch(error => console.error("音声再生エラー:", error));
  }, []);

  // 今日の学習対象カードをロード
  const loadCards = useCallback(async () => {
    const now = new Date();
    // 現在のユーザーIDを仮に1と設定 (後で認証機能と連携)
    const userId = 1;

    // 今日が期限のカードを取得 (due_dateが今日以前のカード)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // 期日が到来しているカード (due_dateが今日以前) または新規カード (state = 0) を取得
    const cardsDueTodayOrNew = await db.cards
      .where('user_id')
      .equals(userId)
      .filter(card => card.due_date.getTime() <= today.getTime() || card.state === State.New)
      .toArray();

    // デバッグ用: 取得したカードの情報をログに出力
    console.log("取得したカード:", cardsDueTodayOrNew);
    const cardsDueToday = cardsDueTodayOrNew;

    // カードをランダムにシャッフル
    const shuffledCards = cardsDueToday.sort(() => Math.random() - 0.5);
    setQueue(shuffledCards);
    setCurrentCard(shuffledCards[0]);
    setIsFlipped(false);
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  // currentCardがセットされたら自動で読み上げ
  useEffect(() => {
    if (currentCard) {
      speakWord(currentCard.word);
    }
  }, [currentCard, speakWord]);


  const handleRate = async (rating: Grade) => {
    if (!currentCard) return;

    // FSRSの計算ロジック
    const f = fsrs(); // FSRSインスタンスを取得

    const fsrsCard: FsrsCard = {
      due: currentCard.due_date,
      stability: currentCard.stability,
      difficulty: currentCard.difficulty,
      elapsed_days: currentCard.elapsed_days,
      scheduled_days: currentCard.scheduled_days,
      learning_steps: currentCard.learning_steps, // 新しく追加
      reps: currentCard.reps,
      lapses: currentCard.lapses,
      state: currentCard.state as State, // FSRSのStateに変換
      last_review: currentCard.last_review,
    };

    const now = new Date();
    // nextStateを呼び出す前に、reviewログを記録する必要があります。
    // FSRSの仕様上、nextStateはreviewログを考慮して次のカードの状態を計算します。
    // 現状、reviewログは別のテーブルにあるので、ここでは簡易的に現在のカード状態を更新します。
    // 実際には、reviewログも作成し、FSRS.next() メソッドなどを使用します。

    const newCardState = f.repeat(
      fsrsCard,
      now,
    )[rating]; // IPreviewはRecordLogを拡張しており、ratingで直接アクセス可能

    // Dexie DBのカードを更新
    await db.cards.update(currentCard.id!, {
      due_date: newCardState.card.due,
      stability: newCardState.card.stability,
      difficulty: newCardState.card.difficulty,
      elapsed_days: newCardState.card.elapsed_days,
      scheduled_days: newCardState.card.scheduled_days,
      reps: newCardState.card.reps,
      lapses: newCardState.card.lapses,
      state: newCardState.card.state as ICard['state'], // ICardのstate型に変換
      last_review: now,
      updated_at: now,
      sync_status: 'pending', // 変更があったので同期待ち状態
    });

    // レビューログを保存
    await db.review_logs.add({
      card_id: currentCard.id!,
      user_id: currentCard.user_id,
      review_date: now,
      rating: rating,
      elapsed_days: newCardState.log.elapsed_days,
      scheduled_days: newCardState.log.scheduled_days,
      state: newCardState.log.state as ICard['state'], // ICardのstate型に変換
      due_date: newCardState.log.due,
      sync_status: 'pending',
    });


    // 次のカードを表示
    const nextQueue = queue.slice(1);
    setQueue(nextQueue);
    setCurrentCard(nextQueue[0]);
    setIsFlipped(false);
  };

  const handleResetAndSeedDB = async () => {
    // DebugPanelのhandleResetAndSeedDBと同じロジックを呼び出すか、リダイレクトする
    // ここでは単純にページをリロードしてApp.tsxでDebugPanelがレンダリングされるようにする
    // 実際にはDebugPanelの関数をexportして呼び出す方が良いが、今回は簡易的に
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
      <Flashcard word={currentCard.word} meaning={currentCard.meaning} />
      <button onClick={() => speakWord(currentCard.word)} style={{
        marginTop: '10px',
        padding: '10px 15px',
        fontSize: '16px',
        cursor: 'pointer',
      }}>
        単語を読み上げる
      </button>
      {isFlipped ? <RatingButtons onRate={handleRate} /> : <button onClick={() => setIsFlipped(true)}>Show Answer</button>}
    </div>
  );
};

export default StudySession;