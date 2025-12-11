import React from 'react';
import StudySession from './components/StudySession';
import DebugPanel from './components/DebugPanel'; // DebugPanelをインポート

const App: React.FC = () => {
  return (
    <div className="App">
      <StudySession />
      <DebugPanel /> {/* DebugPanelを配置 */}
    </div>
  );
};

export default App;