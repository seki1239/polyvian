import React from 'react';

interface FooterProps {
  onOpenInfo: () => void;
  onOpenContact: () => void;
  onLogout: () => void; // ログアウト機能を追加
}

const Footer: React.FC<FooterProps> = ({ onOpenInfo, onOpenContact, onLogout }) => {
  return (
    <footer className="app-footer" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <p style={{ margin: 0 }}>© 2025 CogniVocab</p>
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
        <button className="footer-link" onClick={onOpenInfo}>
          About / Terms
        </button>
        <button className="footer-link" onClick={onOpenContact}>
          Contact
        </button>
        <button className="footer-link" onClick={onLogout}>
          ログアウト
        </button>
      </div>
    </footer>
  );
};

export default Footer;