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
          CogniVocabは、科学的根拠に基づいた、完全無料・オフライン対応の英単語学習アプリです。
        </p>
        
        <div className="legal-section">
          <div className="legal-title">オープンソースソフトウェア (OSS)</div>
          <p className="legal-text">
            本サービスは、React, Vite, Dexie.js, ts-fsrs などの素晴らしいオープンソースソフトウェアによって支えられています。
          </p>
        </div>

        <div className="legal-section">
          <div className="legal-title">利用規約</div>
          <p className="legal-text">
            本サービスは無料で提供されており、学習効果を保証するものではありません。
            ユーザーの学習データは、ブラウザ内に安全に保存され、同期機能を使用する場合のみサーバーへ暗号化して送信されます。
            サービスの内容は予告なく変更される場合があります。
          </p>
        </div>

        <div className="legal-section">
          <div className="legal-title">プライバシーポリシー</div>
          <p className="legal-text">
            私たちは「Local-First」アーキテクチャを採用しており、ユーザーのプライバシーを最優先に設計しています。
            個人を特定できる情報は、アカウント管理とデータ同期の目的以外には使用しません。
            また、学習データの分析は、サービスの品質向上のために匿名化された状態でのみ行われます。
            Google Analytics等によるアクセス解析を行っています。
          </p>
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button className="modal-close-button" onClick={onClose}>閉じる</button>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;