import React from 'react';
import { Home, Trophy, Activity } from 'lucide-react';

export type TabType = 'home' | 'ranking' | 'activity';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', label: 'HOME', icon: Home },
    { id: 'ranking', label: 'Ranking', icon: Trophy },
    { id: 'activity', label: 'Activity', icon: Activity },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-surface safe-area-pb">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center w-full py-v-lg transition-colors ${
                isActive ? 'text-primary' : 'text-light hover:text-primary/70'
              }`}
            >
              <Icon size={24} className={isActive ? 'mb-1' : 'mb-1 opacity-70'} />
              <span className={`text-xs font-bold ${isActive ? '' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
