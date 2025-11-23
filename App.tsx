import React, { useState } from 'react';
import NavBar from './components/NavBar';
import JobSection from './components/JobSection';
import IdeaSection from './components/IdeaSection';
import VeoStudio from './components/VeoStudio';
import LiveAssistant from './components/LiveAssistant';
import { AppView } from './types';

// Extend the AIStudio interface which is already declared on Window in the environment.
// This avoids "Subsequent property declarations must have the same type" errors.
declare global {
  interface AIStudio {
    hasSelectedApiKey(): Promise<boolean>;
    openSelectKey(): Promise<boolean>;
  }
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.JOBS);

  const renderView = () => {
    switch (currentView) {
      case AppView.JOBS:
        return <JobSection />;
      case AppView.IDEAS:
        return <IdeaSection />;
      case AppView.VEO:
        return <VeoStudio />;
      case AppView.LIVE:
        return <LiveAssistant />;
      default:
        return <JobSection />;
    }
  };

  return (
    <div className="h-full w-full bg-slate-50 relative">
      <header className="bg-white shadow-sm p-4 sticky top-0 z-40 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">L</div>
            <h1 className="font-bold text-xl text-slate-800">Lavoro Italia AI</h1>
         </div>
      </header>
      
      <main className="h-full overflow-y-auto no-scrollbar">
        {renderView()}
      </main>

      <NavBar currentView={currentView} onNavigate={setCurrentView} />
    </div>
  );
};

export default App;