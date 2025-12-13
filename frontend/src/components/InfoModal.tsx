import React from 'react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content info-modal" onClick={e => e.stopPropagation()}>
        <h2>このツールについて</h2>
        <p>
          CogniVocabは、科学的根拠（FSRS理論・インターリービング学習）に基づいた、
          完全無料・オフライン対応の次世代英単語学習アプリケーションです。
        </p>
        
        <h3>OSSライセンス / 使用ライブラリ</h3>
        <p>本アプリは以下のオープンソースソフトウェアを使用しています。</p>
        <ul className="oss-list">
          <li><strong>React</strong> (MIT)</li>
          <li><strong>Vite</strong> (MIT)</li>
          <li><strong>Dexie.js</strong> (Apache-2.0) - IndexedDB Wrapper</li>
          <li><strong>ts-fsrs</strong> (MIT) - Spaced Repetition Algorithm</li>
          <li><strong>Workbox</strong> (MIT) - PWA Support</li>
        </ul>

        <h3>データソース</h3>
        <ul className="oss-list">
          <li><strong>NGSL/NAWL</strong> (CC BY-SA 4.0)</li>
          <li><strong>Tatoeba Project</strong> (CC BY 2.0 FR)</li>
          <li><strong>Kaikki.org (Wiktionary)</strong> (CC BY-SA 3.0)</li>
        </ul>

        <button className="modal-close-button" onClick={onClose}>閉じる</button>
      </div>
    </div>
  );
};

export default InfoModal;