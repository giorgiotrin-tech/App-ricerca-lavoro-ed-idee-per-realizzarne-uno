import React from 'react';
import { AppView } from '../types';

interface NavBarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
}

const NavBar: React.FC<NavBarProps> = ({ currentView, onNavigate }) => {
  const navItems = [
    { id: AppView.JOBS, label: 'Lavoro', icon: '💼' },
    { id: AppView.IDEAS, label: 'Idee', icon: '💡' },
    { id: AppView.VEO, label: 'Video', icon: '🎬' },
    { id: AppView.LIVE, label: 'Assistente', icon: '🎙️' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg pb-safe z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
              currentView === item.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className="text-xl mb-1">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default NavBar;