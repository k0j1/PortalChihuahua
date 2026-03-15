import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserProfile } from '../../models/UserProfile';
import { GameInfo } from '../../models/GameInfo';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Play } from 'lucide-react';
import { getChhBalance } from '../../services/blockchainService';

import packageJson from '../../../package.json';

interface DashboardViewProps {
  user: UserProfile | null;
  games: GameInfo[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({ user, games }) => {
  const [chhBalance, setChhBalance] = useState<string>('0');

  const guestUser: UserProfile = {
    id: 'guest',
    farcasterId: 'Guest',
    name: 'Guest',
    username: 'guest',
    avatarUrl: '',
    chihuahuaIcon: '👤',
    totalScore: 0,
    overallRank: 0,
    walletAddress: ''
  };

  const currentUser = user || guestUser;

  useEffect(() => {
    const fetchBalance = async () => {
      const address = currentUser.walletAddress;
      if (address) {
        getChhBalance(address as `0x${string}`).then(setChhBalance);
      }
    };
    
    fetchBalance();
  }, [currentUser]);

  return (
    <div className="flex flex-col gap-v-lg pb-v-xl">
      {/* ユーザープロフィールセクション */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface p-v-lg rounded-v-lg shadow-v-md border border-surface flex flex-col items-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-24 bg-primary/10" />
        
        {/* バージョン表示 */}
        <div className="absolute top-2 right-3 z-20">
          <span className="text-[10px] font-mono font-bold text-primary/40 bg-village/50 px-2 py-0.5 rounded-full border border-surface/30">
            v{packageJson.version}
          </span>
        </div>

        <div className="relative z-10 flex flex-col items-center w-full">
          <div className="w-24 h-24 bg-village rounded-v-full shadow-v-md border-4 border-surface flex items-center justify-center text-4xl mb-v-sm">
            {currentUser.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              currentUser.chihuahuaIcon
            )}
          </div>
          <h2 className="text-xl font-bold text-primary">{currentUser.name}</h2>
          <p className="text-sm text-light font-mono mb-v-md">{currentUser.farcasterId === 'Guest' ? 'Guest User' : `@${currentUser.username}`}</p>
          
          <div className="flex gap-v-md w-full max-w-xs mb-v-md">
            <div className="flex-1 bg-village p-v-md rounded-v-md text-center border border-surface">
              <p className="text-xs text-light font-bold mb-1">$CHH保有枚数</p>
              <p className="text-lg font-black text-primary">{parseFloat(chhBalance).toLocaleString()}</p>
            </div>
          </div>

          <div className="flex gap-v-md w-full max-w-xs">
            <div className="flex-1 bg-village p-v-md rounded-v-md text-center border border-surface">
              <p className="text-xs text-light font-bold mb-1">総合リワード</p>
              <div className="flex items-baseline justify-center gap-1">
                <p className="text-lg font-black text-accent">{currentUser.totalScore.toLocaleString()}</p>
                <span className="text-[10px] font-bold text-accent">CHH</span>
              </div>
            </div>
            <div className="flex-1 bg-village p-v-md rounded-v-md text-center border border-surface">
              <p className="text-xs text-light font-bold mb-1">総合ランク</p>
              <p className="text-lg font-black text-secondary">{currentUser.overallRank > 0 ? `${currentUser.overallRank}位` : '-'}</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ゲーム一覧セクション */}
      <section>
        <h3 className="text-lg font-bold text-primary mb-v-md flex items-center gap-2">
          <span className="w-1 h-6 bg-accent rounded-v-full"></span>
          ゲームリスト
        </h3>
        <div className="grid grid-cols-1 gap-v-md">
          {games.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div 
                className="flex flex-col bg-surface rounded-v-lg shadow-v-md border border-surface overflow-hidden group hover:shadow-v-lg transition-shadow duration-300"
                style={{ borderLeft: `4px solid ${game.color}` }}
              >
                <div className="flex min-h-32">
                  {/* アイコンを枠と同じ高さで表示 */}
                  <div className="w-32 bg-village flex-shrink-0 relative overflow-hidden">
                    <img 
                      src={game.iconUrl} 
                      alt={game.title} 
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      referrerPolicy="no-referrer" 
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300" />
                  </div>
                  
                  <div className="flex-1 p-v-md flex flex-col justify-between">
                    <div>
                      <h4 className="font-black text-lg text-body leading-tight mb-1">{game.title}</h4>
                      <p className="text-xs text-light line-clamp-2">{game.description}</p>
                    </div>
                    
                    <div className="flex justify-end mt-2">
                      <Button 
                        variant="primary" 
                        size="sm"
                        className="flex items-center gap-2 px-v-lg"
                        onClick={() => {
                          const isFarcaster = window.location.href.includes('farcaster');
                          window.open(isFarcaster ? game.farcasterUrl : game.url, '_blank');
                        }}
                      >
                        <Play size={14} fill="currentColor" />
                        <span className="text-xs font-black">START</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Game Stats Section */}
                {currentUser.fid && currentUser.fid !== 'Guest' && (
                  <div className="bg-village/30 border-t border-surface/50 p-v-md">
                    {game.id === 'running' && (
                      <div className="flex gap-6">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-light uppercase font-bold">Run</span>
                          <span className="text-sm font-black text-primary">{currentUser.runningStats?.runCount || 0} <span className="text-[10px]">RUN</span></span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-light uppercase font-bold">Stamina</span>
                          <span className="text-sm font-black text-primary">{currentUser.runningStats?.stamina || 0}</span>
                        </div>
                      </div>
                    )}
                    {game.id === 'reversi' && (
                      <div className="flex flex-col">
                        <span className="text-[10px] text-light uppercase font-bold">Wins</span>
                        <span className="text-sm font-black text-primary">🏆️ {currentUser.reversiStats?.totalWins || 0}</span>
                      </div>
                    )}
                    {game.id === 'mining' && (
                      <div className="grid grid-cols-3 gap-y-4 gap-x-3">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-light uppercase font-bold">Quest</span>
                          <span className="text-sm font-black text-primary">📜 {currentUser.miningStats?.questCount || 0}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-light uppercase font-bold">Hero</span>
                          <span className="text-sm font-black text-primary">🐕️ {currentUser.miningStats?.gachaHeroCount || 0}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-light uppercase font-bold">Equip</span>
                          <span className="text-sm font-black text-primary">⛏️ {currentUser.miningStats?.gachaEquipmentCount || 0}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-light uppercase font-bold">Potion</span>
                          <span className="text-sm font-black text-primary">{currentUser.miningStats?.item01 || 0}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-light uppercase font-bold">Elixir</span>
                          <span className="text-sm font-black text-primary">{currentUser.miningStats?.item02 || 0}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-light uppercase font-bold">Stone</span>
                          <span className="text-sm font-black text-primary">🪨 {currentUser.miningStats?.item03 || 0}</span>
                        </div>
                      </div>
                    )}
                    {game.id === 'quest' && (
                      <div className="flex flex-col">
                        <span className="text-[10px] text-light uppercase font-bold">Status</span>
                        <span className="text-sm font-black text-primary">No stats available</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};
