import React, { useState, useEffect, useCallback } from 'react';
import StudySession from './components/StudySession';
import DebugPanel from './components/DebugPanel';
import AuthScreen from './components/AuthScreen'; // AuthScreenをインポート
import { db, type IUser } from './db/db';
import type { ICard, IReviewLog, ISyncQueue } from './db/db'; // SyncManagerで必要になるため追加

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// SyncManagerのインスタンスを生成
const syncManager = new SyncManager();

const App: React.FC = () => {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  // SyncManagerの型定義を更新し、AuthScreenからのonLoginSuccessの型と合わせる
  // AuthScreenから渡されるユーザーデータの型定義
  interface AuthUserData {
    id: string; // AuthScreenはidをstringとして扱う
    username: string;
  }

  const performSync = useCallback(async (currentUserId: number | undefined | null) => {
    if (currentUserId) {
      await syncManager.sync(currentUserId);
    } else {
      console.warn("App.tsx: No user ID for synchronization. Skipping sync.");
    }
  }, []);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await fetch(`${API_BASE}/auth.php?action=me`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok && data.user) {
          // バックエンドからのuserデータはidがnumberで返ってくると想定
          const fetchedUser: IUser = {
            id: typeof data.user.id === 'string' ? parseInt(data.user.id, 10) : data.user.id, // 必要に応じて型変換
            username: data.user.username,
            // サーバーから返される他のユーザー情報もここにマッピング
            // password_hash はフロントエンドでは不要なため含めない
            created_at: data.user.created_at ? new Date(data.user.created_at) : new Date(),
            updated_at: data.user.updated_at ? new Date(data.user.updated_at) : new Date(),
          };
          setUser(fetchedUser);
          await db.users.put(fetchedUser);
          performSync(fetchedUser.id);
        } else {
          console.error('Token validation failed:', data.message || data.error);
          localStorage.removeItem('token');
          setUser(null);
        }
      } catch (error) {
        console.error('Error validating token:', error);
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setLoading(false);
  }, [performSync]);

  useEffect(() => {
    checkAuth();
    // オフラインからオンラインに復帰したときに同期を試みる
    const handleOnline = () => {
      console.log("App.tsx: Browser is online. Attempting sync.");
      performSync(user?.id || null);
    };
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [checkAuth, performSync, user?.id]);

  // AuthScreenのonLoginSuccessの型に合わせる
  const handleLoginSuccess = (userFromAuth: { id: string; username: string }, token: string) => {
    localStorage.setItem('token', token);
    const loggedInUser: IUser = {
      id: parseInt(userFromAuth.id, 10), // AuthScreenからのidはstringなのでnumberに変換
      username: userFromAuth.username,
      // password_hash はフロントエンドでは不要なため含めない
      created_at: new Date(), // ログイン時は現在時刻を仮で設定
      updated_at: new Date(), // ログイン時は現在時刻を仮で設定
    };
    setUser(loggedInUser);
    db.users.put(loggedInUser); // IndexedDBに保存
    performSync(loggedInUser.id);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    // Optionally clear local data for the user or prompt for it
    console.log("User logged out.");
  };

  if (loading) {
    return <div>読み込み中...</div>; // ローディング画面
  }

  return (
    <div className="main-container">
      {user ? (
        <>
          <button onClick={handleLogout} className="logout-button">ログアウト</button>
          <StudySession />
          <DebugPanel onManualSync={async () => {
            if (user?.id) {
              console.log("App.tsx: Manual sync initiated.");
              await syncManager.sync(user.id);
              alert("同期が完了しました。");
            } else {
              alert("同期するユーザーが見つかりません。");
            }
          }} />
        </>
      ) : (
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
};

export default App;