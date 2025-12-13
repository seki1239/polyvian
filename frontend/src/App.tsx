import React, { useEffect } from 'react';
import StudySession from './components/StudySession';
import DebugPanel from './components/DebugPanel'; // DebugPanelをインポート
import { SyncManager } from './utils/SyncManager';
import { db } from './db/db';

const API_ENDPOINT = import.meta.env.PROD
  ? '/api/sync.php' // 本番環境
  : 'http://localhost:8000/api/sync.php'; // 開発環境

const syncManager = new SyncManager(API_ENDPOINT);

const App: React.FC = () => {
  useEffect(() => {
    const performSync = async () => {
      // 実際にはログインユーザーIDを取得するロジックが必要
      // ここでは仮にユーザーID: 1 を使用
      const currentUser = await db.users.where('username').equals('demo_user').first();
      if (currentUser?.id) {
        await syncManager.sync(currentUser.id);
      } else {
        console.warn("App.tsx: No demo user found for synchronization. Skipping sync.");
      }
    };

    // アプリ起動時に同期を実行
    performSync();

    // ブラウザがオンラインになった時に同期を実行
    window.addEventListener('online', performSync);

    // クリーンアップ
    return () => {
      window.removeEventListener('online', performSync);
    };
  }, []);
  return (
    <div className="main-container"> {/* main-container クラスを適用 */}
      <StudySession />
      <DebugPanel onManualSync={async () => {
        const currentUser = await db.users.where('username').equals('demo_user').first();
        if (currentUser?.id) {
          console.log("App.tsx: Manual sync initiated.");
          await syncManager.sync(currentUser.id);
          alert("同期が完了しました。");
        } else {
          alert("同期するユーザーが見つかりません。");
        }
      }} /> {/* DebugPanelを配置し、手動同期ボタンのハンドラーを渡す */}
    </div>
  );
};

export default App;