import React, { useState, useEffect, useCallback } from 'react'; // useStateを追加
import StudySession from './components/StudySession';
import DebugPanel from './components/DebugPanel';
import AuthScreen from './components/AuthScreen';
import Footer from './components/Footer'; // 追加
import InfoModal from './components/InfoModal'; // 追加
import { db, type IUser } from './db/db';
import type { ICard, IReviewLog, ISyncQueue } from './db/db'; // SyncManagerで必要になるため追加
import { syncManager } from './utils/SyncManager';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const App: React.FC = () => {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true); // 修正
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false); // 追加

  // SyncManagerの型定義を更新し、AuthScreenからのonLoginSuccessの型と合わせる
  // AuthScreenから渡されるユーザーデータの型定義
  interface AuthUserData {
    id: string; // AuthScreenはidをstringとして扱う
    username: string;
  }

  const performSync = useCallback(async (currentUserId: number | undefined | null) => {
    if (currentUserId) {
      await syncManager.sync(currentUserId); // 引数を元に戻す
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
    // ... 既存の同期ロジック ...
    const initSync = async () => {
      await syncManager.sync();
    };
    initSync();
    // ...
    
    // ... 既存のログインチェック ...
    const checkLogin = async () => {
       // ... 既存ロジック ...
       const token = localStorage.getItem('token');
       // 仮の実装: トークンがあればデモユーザーとして扱う（実際は/meで検証）
       if (token) {
         // ここは本来の実装に合わせてください
         setUser({ username: 'demo_user' } as IUser);
       }
    };
    checkLogin();
    // オフラインからオンラインに復帰したときに同期を試みる
    const handleOnline = () => {
      console.log("App.tsx: Browser is online. Attempting sync.");
      performSync(user?.id || null);
    };
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // AuthScreenのonLoginSuccessの型に合わせる
  const handleManualSync = () => {
    if (user?.id) {
      syncManager.sync(user.id).then(() => alert('同期処理が完了しました')); // user.idを引数に追加
    } else {
      alert('同期するユーザーが見つかりません。');
    }
  };

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
      {!user ? (
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      ) : (
        <>
          <StudySession />
          
          <div style={{ position: 'fixed', bottom: '100px', right: '20px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '10px' }}>
             <button
              onClick={handleManualSync}
              style={{
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
              }}
            >
              🔄 手動同期
            </button>
            <DebugPanel />
          </div>
        </>
      )}
      
      {/* フッターとモーダルを追加 */}
      <Footer onOpenInfo={() => setIsInfoModalOpen(true)} />
      <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />
    </div>
  );
};

export default App;