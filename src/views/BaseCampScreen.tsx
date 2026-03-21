import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Header } from '../components/layout/Header';
import { BottomNav, TabType } from '../components/layout/BottomNav';
import { DashboardView } from './tabs/DashboardView';
import { RankingView } from './tabs/RankingView';
import { ActivityView } from './tabs/ActivityView';
import { GameService } from '../services/GameService';
import { UserProfile } from '../models/UserProfile';
import { GameInfo } from '../models/GameInfo';
import { DebugWindow } from '../components/DebugWindow';
import { Terminal } from 'lucide-react';

export const BaseCampScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [games, setGames] = useState<GameInfo[]>([]);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const gameService = GameService.getInstance();
    setGames(gameService.getGames());
    
    // ユーザープロフィールの取得
    gameService.getUserProfile().then(setUser).catch(console.error);
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(contentRef.current, 
        { opacity: 0, x: 20 }, 
        { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }
      );
    }
  }, [activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <DashboardView user={user} games={games} />;
      case 'ranking':
        return <RankingView games={games} />;
      case 'activity':
        return <ActivityView />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-village pt-20 pb-28">
      <Header user={user} />
      
      <main className="flex-1 overflow-y-auto p-v-md">
        <div
          ref={contentRef}
          className="h-full"
        >
          {renderContent()}
        </div>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Debug Button for FID 406233 */}
      {user?.fid === '406233' && (
        <button
          onClick={() => setIsDebugOpen(true)}
          className="fixed bottom-24 right-4 z-50 p-3 rounded-full bg-primary text-inverse shadow-v-lg hover:scale-110 transition-transform"
          title="Debug Console"
        >
          <Terminal size={24} />
        </button>
      )}

      <DebugWindow 
        isOpen={isDebugOpen} 
        onClose={() => setIsDebugOpen(false)} 
      />
    </div>
  );
};
