import React from 'react';
import { db, type ICard, type CardState, type SyncStatus } from '../db/db'; // SyncStatusを型としてインポート
import { createEmptyCard, Rating, State } from 'ts-fsrs';
import masterData from '../assets/master_data.json'; // master_data.jsonをインポート

const DebugPanel: React.FC = () => {
  const handleResetAndSeedDB = async () => {
    if (!window.confirm('本当にデータベースをリセットして初期データを投入しますか？')) {
      return;
    }

    try {
      console.log('データベースをクリア中...');
      // DBへの接続を閉じる
      db.close();
      // すべてのテーブルをクリア
      await db.delete(); // DBを削除
      // 新しいDB接続を開く (Dexieは自動的に開く)
      await db.open();
      await db.cards.clear();
      await db.review_logs.clear();
      await db.sync_queue.clear();
      // usersテーブルはクリアしない (demo_userを残すため)
      console.log('データベースのクリアが完了しました。');

      console.log('初期データを投入中...');
      const now = new Date();

      // ユーザーが存在しない場合のみ作成 (db.tsと同じロジック)
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
        const currentUserId: number = user.id; // user.id が number であることを保証
        const cardsToAdd: ICard[] = masterData.map((data: MasterDataItem) => {
          const fsrsCard = createEmptyCard(now);
          return {
            id: data.id, // ★ここを追加！JSONのIDを強制的に使用する
            user_id: currentUserId,
            word: data.word,
            definition: data.definition,
            sentence: data.sentence,
            similar_ids: data.similar_words_ids || data.similar_ids || [],
            due_date: fsrsCard.due,
            stability: fsrsCard.stability,
            difficulty: fsrsCard.difficulty,
            elapsed_days: fsrsCard.elapsed_days,
            scheduled_days: fsrsCard.scheduled_days,
            reps: fsrsCard.reps,
            lapses: fsrsCard.lapses,
            learning_steps: fsrsCard.learning_steps,
            state: fsrsCard.state as CardState,
            last_review: fsrsCard.last_review,
            created_at: now,
            updated_at: now,
            sync_status: 'synced' as SyncStatus,
          };
        });

        await db.cards.bulkAdd(cardsToAdd);
        console.log(`${cardsToAdd.length}枚の初期カードを投入しました。(master_data.jsonより)`);
      } else {
        console.error('ユーザーIDが見つからないため、カードを投入できませんでした。');
      }

      alert('データベースのリセットと初期データの投入が完了しました。ページをリロードします。');
      window.location.reload(); // ページをリロードして変更を反映
    } catch (error: any) {
      console.error('データベースのリセットと初期データの投入中にエラーが発生しました:', error);
      alert(`エラーが発生しました: ${error.message}`);
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