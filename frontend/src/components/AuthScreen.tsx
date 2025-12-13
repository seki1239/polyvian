import React, { useState } from 'react';

interface AuthScreenProps {
  onLoginSuccess: (user: { id: string; username: string }, token: string) => void; // App.tsxのhandleLoginSuccessと型を合わせる
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    const endpoint = isRegister ? `${API_BASE}/auth.php?action=register` : `${API_BASE}/auth.php?action=login`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('user_id', data.user.id); // ユーザーIDを保存
        onLoginSuccess(data.user, data.token);
      } else {
        setError(data.message || '認証に失敗しました。');
      }
    } catch (err) {
      setError('サーバーとの通信に失敗しました。');
      console.error('認証エラー:', err);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-tabs">
        <button
          className={`auth-tab-button ${!isRegister ? 'active' : ''}`}
          onClick={() => setIsRegister(false)}
        >
          ログイン
        </button>
        <button
          className={`auth-tab-button ${isRegister ? 'active' : ''}`}
          onClick={() => setIsRegister(true)}
        >
          新規登録
        </button>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">ユーザー名:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">パスワード:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="auth-error-message">{error}</p>}
        <button type="submit" className="auth-submit-button">
          {isRegister ? '新規登録' : 'ログイン'}
        </button>
      </form>
    </div>
  );
};

export default AuthScreen;