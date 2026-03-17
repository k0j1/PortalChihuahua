import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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

  useEffect(() => {
    const gameService = GameService.getInstance();
    setGames(gameService.getGames());
    
    // ユーザープロフィールの取得
    gameService.getUserProfile().then(setUser).catch(console.error);
  }, []);

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
    <div className="flex flex-col min-h-screen bg-village pt-32 pb-36">
      <Header user={user} />
      
      <main className="flex-1 overflow-y-auto p-v-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
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
