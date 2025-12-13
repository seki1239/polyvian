import React from 'react';

interface FooterProps {
  onOpenInfo: () => void;
}

const Footer: React.FC<FooterProps> = ({ onOpenInfo }) => {
  return (
    <footer className="app-footer">
      <p>© 2025 CogniVocab</p>
      <button className="footer-link" onClick={onOpenInfo}>
        About / OSS
      </button>
    </footer>
  );
};

export default Footer;