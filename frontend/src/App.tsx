import React, { useState, useEffect } from 'react';
import StudySession from './components/StudySession';
import DebugPanel from './components/DebugPanel';
import AuthScreen from './components/AuthScreen';
import Footer from './components/Footer';
import InfoModal from './components/InfoModal';
import ContactModal from './components/ContactModal'; // 追加
import { db, type IUser } from './db/db';
import type { ICard, IReviewLog, ISyncQueue } from './db/db';
import { syncManager } from './utils/SyncManager';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const App: React.FC = () => {
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false); // 追加

  // SyncManagerの型定義を更新し、AuthScreenからのonLoginSuccessの型と合わせる
  // AuthScreenから渡されるユーザーデータの型定義
  interface AuthUserData {
    id: string; // AuthScreenはidをstringとして扱う
    username: string;
  }

  useEffect(() => {
    const initApp = async () => {
      try {
        // 1. トークンチェック (/me)
        const token = localStorage.getItem('token');
        let currentUser: IUser | null = null;

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
              currentUser = {
                id: typeof data.user.id === 'string' ? parseInt(data.user.id, 10) : data.user.id, // 必要に応じて型変換
                username: data.user.username,
                // サーバーから返される他のユーザー情報もここにマッピング
                // password_hash はフロントエンドでは不要なため含めない
                created_at: data.user.created_at ? new Date(data.user.created_at) : new Date(),
                updated_at: data.user.updated_at ? new Date(data.user.updated_at) : new Date(),
              };
              await db.users.put(currentUser); // IndexedDBに保存
            } else {
              console.error('Token validation failed:', data.message || data.error);
              localStorage.removeItem('token');
              localStorage.removeItem('user_id'); // ユーザーIDも削除
            }
          } catch (error) {
            console.error('Error validating token:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user_id'); // ユーザーIDも削除
          }
        }

        // 2. ログイン状態の反映
        if (currentUser) {
          setUser(currentUser);
          
          // 3. 同期処理 (ログインしている場合のみ実行！)
          try {
            console.log('User logged in, starting background sync...');
            await syncManager.sync();
          } catch (syncErr) {
            console.warn('Background sync failed:', syncErr);
            // 同期失敗は致命的ではないのでアプリは続行
          }
        } else {
          setUser(null); // 未ログイン状態を明示
        }
      } catch (error) {
        console.error('Initialization failed:', error);
        // 認証エラーならトークン削除などのクリーンアップ
        localStorage.removeItem('token');
        localStorage.removeItem('user_id'); // ユーザーIDも削除
        setUser(null); // エラー発生時も未ログイン状態に
      } finally {
        // 4. ロード完了 (成功・失敗に関わらず必ず実行)
        setIsLoading(false);
      }
    };

    initApp();

    // オフラインからオンラインに復帰したときに同期を試みる
    const handleOnline = () => {
      console.log("App.tsx: Browser is online. Attempting sync.");
      // ログイン済みのユーザーがいれば、そのIDで同期を試みる
      // SyncManager内でユーザーIDの有無をチェックするので、ここではsync()を直接呼ぶ
      if (localStorage.getItem('token')) { // トークンが存在する場合のみ同期を試みる
        syncManager.sync();
      }
    };
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []); // user を依存配列から削除

  const handleManualSync = async () => {
    if (user?.id) {
      await syncManager.sync();
      alert('同期処理が完了しました');
    } else {
      alert('同期するユーザーが見つかりません。ログインしてください。');
    }
  };

  const handleLoginSuccess = (userFromAuth: { id: string; username: string }, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user_id', userFromAuth.id); // ユーザーIDを保存
    const loggedInUser: IUser = {
      id: parseInt(userFromAuth.id, 10), // AuthScreenからのidはstringなのでnumberに変換
      username: userFromAuth.username,
      // password_hash はフロントエンドでは不要なため含めない
      created_at: new Date(), // ログイン時は現在時刻を仮で設定
      updated_at: new Date(), // ログイン時は現在時刻を仮で設定
    };
    setUser(loggedInUser);
    db.users.put(loggedInUser); // IndexedDBに保存
    // ログイン成功後の同期は、initAppと同様にsyncManager.sync()を直接呼ぶ
    // SyncManager側でユーザーIDの存在確認を行う
    console.log('Login success, initiating sync...');
    syncManager.sync();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_id'); // ログアウト時にユーザーIDも削除
    setUser(null);
    // Optionally clear local data for the user or prompt for it
    console.log("User logged out.");
  };

  if (isLoading) {
    return <div className="loading-screen">読み込み中...</div>;
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
      
      <Footer
        onOpenInfo={() => setIsInfoModalOpen(true)}
        onOpenContact={() => setIsContactModalOpen(true)}
        onLogout={handleLogout}
      />
      
      <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />
      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
    </div>
  );
};

export default App;