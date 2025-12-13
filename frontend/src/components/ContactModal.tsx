// frontend/src/components/ContactModal.tsx
import React, { useState } from 'react';

// APIのエンドポイント設定
const API_URL = import.meta.env.VITE_API_BASE_URL 
  ? `${import.meta.env.VITE_API_BASE_URL}/contact.php`
  : 'http://localhost:8000/api/contact.php';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>お問い合わせ</h2>
        
        {status === 'success' ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p style={{ color: '#52c41a', fontWeight: 'bold' }}>送信ありがとうございます。</p>
            <p>お問い合わせを受け付けました。</p>
            <button onClick={onClose} style={{ marginTop: '20px' }}>閉じる</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div>
              <label style={{ fontSize: '0.9em', color: '#666' }}>お名前</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.9em', color: '#666' }}>メールアドレス</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.9em', color: '#666' }}>お問い合わせ内容</label>
              <textarea
                required
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
              />
            </div>
            
            {status === 'error' && <p style={{ color: 'red', fontSize: '0.9em' }}>送信に失敗しました。時間をおいて再度お試しください。</p>}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="button" onClick={onClose} style={{ flex: 1, backgroundColor: '#ccc' }}>キャンセル</button>
              <button type="submit" disabled={status === 'submitting'} style={{ flex: 2 }}>
                {status === 'submitting' ? '送信中...' : '送信する'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ContactModal;