import React from 'react';
import { db, type ICard, type CardState } from '../db/db';
import { createEmptyCard, Rating, State } from 'ts-fsrs';

const DebugPanel: React.FC = () => {
  const handleResetAndSeedDB = async () => {
    if (!window.confirm('本当にデータベースをリセットして初期データを投入しますか？')) {
      return;
    }

    try {
      console.log('データベースをクリア中...');
      await db.cards.clear();
      await db.review_logs.clear();
      // 他のテーブルも必要に応じてクリア
      console.log('データベースのクリアが完了しました。');

      console.log('初期データを投入中...');
      const now = new Date();

      // ユーザーが存在しない場合のみ作成
      let user = await db.users.where('username').equals('demo_user').first();
      if (!user) {
        const userId = await db.users.add({
          username: 'demo_user',
          password_hash: 'hashed_password_for_demo', // モックなので仮の値
          created_at: now,
          updated_at: now,
        });
        user = { id: userId, username: 'demo_user', password_hash: 'hashed_password_for_demo', created_at: now, updated_at: now };
        console.log(`Demo user created with ID: ${userId}`);
      }

      if (user?.id) {
        const initialCardsData = [
          {
            word: 'Hello',
            meaning: 'こんにちは',
            example_sentence: 'Hello, how are you?',
          },
          {
            word: 'World',
            meaning: '世界',
            example_sentence: 'The world is vast.',
          },
          {
            word: 'Polyvian',
            meaning: 'ポリビアン (固有名詞)',
            example_sentence: 'Welcome to Polyvian!',
          },
          {
            word: 'Learning',
            meaning: '学習',
            example_sentence: 'Learning is fun.',
          },
          {
            word: 'TypeScript',
            meaning: 'TypeScript (プログラミング言語)',
            example_sentence: 'TypeScript adds types to JavaScript.',
          },
          {
            word: 'Database',
            meaning: 'データベース',
            example_sentence: 'This application uses IndexedDB as a local database.',
          },
          {
            word: 'Dexie',
            meaning: 'Dexie.js (IndexedDBラッパー)',
            example_sentence: 'Dexie simplifies IndexedDB operations.',
          },
          {
            word: 'React',
            meaning: 'React (JavaScriptライブラリ)',
            example_sentence: 'React is used for building user interfaces.',
          },
        ];

        const cardsToAdd: ICard[] = [];
        for (const cardData of initialCardsData) {
          const fsrsCard = createEmptyCard(now); // FSRSの初期カード状態を生成
          cardsToAdd.push({
            user_id: user.id,
            word: cardData.word,
            meaning: cardData.meaning,
            example_sentence: cardData.example_sentence,
            due_date: fsrsCard.due,
            stability: fsrsCard.stability,
            difficulty: fsrsCard.difficulty,
            elapsed_days: fsrsCard.elapsed_days,
            scheduled_days: fsrsCard.scheduled_days,
            reps: fsrsCard.reps,
            lapses: fsrsCard.lapses,
            learning_steps: fsrsCard.learning_steps,
            state: fsrsCard.state as CardState, // 型アサーション
            last_review: fsrsCard.last_review,
            created_at: now,
            updated_at: now,
            sync_status: 'synced',
          });
        }
        await db.cards.bulkAdd(cardsToAdd);
        console.log(`${cardsToAdd.length}枚の初期カードを投入しました。`);
      } else {
        console.error('ユーザーIDが見つからないため、カードを投入できませんでした。');
      }

      alert('データベースのリセットと初期データの投入が完了しました。ページをリロードします。');
      window.location.reload(); // ページをリロードして変更を反映
    } catch (error) {
      console.error('データベースのリセットと初期データの投入中にエラーが発生しました:', error);
      alert('エラーが発生しました。詳細はコンソールを確認してください。');
    }
  };

  return (
    <div className="debug-panel">
      <h4>デバッグパネル</h4>
      <button onClick={handleResetAndSeedDB}>
        DBリセット & シード投入
      </button>
    </div>
  );
};

export default DebugPanel;