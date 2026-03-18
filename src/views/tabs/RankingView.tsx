import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { supabase } from '../../services/supabaseClient';
import { RankingEntry } from '../../models/RankingEntry';
import { GameInfo } from '../../models/GameInfo';
import { Trophy, RefreshCcw } from 'lucide-react';
import { GameService } from '../../services/GameService';

interface RankingViewProps {
  games: GameInfo[];
}

export const RankingView: React.FC<RankingViewProps> = ({ games }) => {
  const [activeTab, setActiveTab] = useState<string>('overall');
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listItemsRef = useRef<HTMLLIElement[]>([]);
  const notebookRef = useRef<HTMLDivElement>(null);

  const fetchRanking = async (forceRefresh = false) => {
    const gameService = GameService.getInstance();
    const cachedRanking = gameService.getRankingCache(activeTab);

    if (!forceRefresh && cachedRanking) {
      setRankings(cachedRanking);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      let rankingsData: RankingEntry[] = [];

      if (activeTab === 'overall') {
        // 総合ランキング: 各ゲームのスコアを合算
        // RunningChihuahua: total_score * 0.05
        // Reversi: claimed_score
        // MiningQuest: total_reward
        const [runningRes, reversiRes, miningRes] = await Promise.all([
          supabase.from('running_player_stats').select('fid, total_score, farcaster_users(username, display_name, pfp_url)'),
          supabase.from('reversi_game_stats').select('fid, claimed_score, farcaster_users(username, display_name, pfp_url)'),
          supabase.from('quest_player_stats').select('fid, total_reward, farcaster_users(username, display_name, pfp_url)')
        ]);

        if (runningRes.error) throw runningRes.error;
        if (reversiRes.error) throw reversiRes.error;
        if (miningRes.error) throw miningRes.error;

        const aggregated: Record<string, { score: number, user: any }> = {};

        const processStats = (data: any[], scoreKey: string, multiplier: number = 1) => {
          data.forEach(item => {
            const fid = item.fid;
            const score = (item[scoreKey] || 0) * multiplier;
            const user = Array.isArray(item.farcaster_users) ? item.farcaster_users[0] : item.farcaster_users;
            
            if (!aggregated[fid]) {
              aggregated[fid] = { score: 0, user };
            }
            aggregated[fid].score += score;
            if (!aggregated[fid].user && user) {
              aggregated[fid].user = user;
            }
          });
        };

        processStats(runningRes.data || [], 'total_score', 0.05);
        processStats(reversiRes.data || [], 'claimed_score');
        processStats(miningRes.data || [], 'total_reward');

        rankingsData = Object.values(aggregated)
          .sort((a, b) => b.score - a.score)
          .slice(0, 30)
          .map((item, idx) => new RankingEntry(
            idx + 1,
            item.user?.display_name || item.user?.username || 'Unknown',
            Math.floor(item.score),
            '',
            item.user?.pfp_url,
            item.user?.username
          ));
      } else if (activeTab === 'running') {
        const { data, error } = await supabase
          .from('running_player_stats')
          .select(`
            total_score,
            farcaster_users!inner (
              username,
              display_name,
              pfp_url
            )
          `)
          .order('total_score', { ascending: false })
          .limit(100);

        if (error) throw error;
        
        rankingsData = data.map((r: any, idx: number) => {
          const user = Array.isArray(r.farcaster_users) ? r.farcaster_users[0] : r.farcaster_users;
          return new RankingEntry(
            idx + 1,
            user?.display_name || user?.username || 'Unknown',
            r.total_score,
            '',
            user?.pfp_url,
            user?.username
          );
        });
      } else if (activeTab === 'reversi') {
        const { data, error } = await supabase
          .from('reversi_game_stats')
          .select(`
            claimed_score,
            farcaster_users!inner (
              username,
              display_name,
              pfp_url
            )
          `)
          .order('claimed_score', { ascending: false })
          .limit(100);

        if (error) throw error;
        
        rankingsData = data.map((r: any, idx: number) => {
          const user = Array.isArray(r.farcaster_users) ? r.farcaster_users[0] : r.farcaster_users;
          return new RankingEntry(
            idx + 1,
            user?.display_name || user?.username || 'Unknown',
            r.claimed_score,
            '',
            user?.pfp_url,
            user?.username
          );
        });
      } else if (activeTab === 'mining') {
        const { data, error } = await supabase
          .from('quest_player_stats')
          .select(`
            total_reward,
            farcaster_users!inner (
              username,
              display_name,
              pfp_url
            )
          `)
          .order('total_reward', { ascending: false })
          .limit(100);

        if (error) throw error;
        
        rankingsData = data.map((r: any, idx: number) => {
          const user = Array.isArray(r.farcaster_users) ? r.farcaster_users[0] : r.farcaster_users;
          return new RankingEntry(
            idx + 1,
            user?.display_name || user?.username || 'Unknown',
            r.total_reward,
            '',
            user?.pfp_url,
            user?.username
          );
        });
      } else {
        const { data, error } = await supabase
          .from('rankings')
          .select('*')
          .eq('game_id', activeTab)
          .order('score', { ascending: false })
          .limit(100);

        if (error) throw error;
        
        rankingsData = data.map((r: any, idx: number) => new RankingEntry(
          idx + 1, 
          r.player_name, 
          r.score, 
          new Date(r.updated_at).toLocaleDateString()
        ));
      }
      
      setRankings(rankingsData);
      gameService.setRankingCache(activeTab, rankingsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ランキングの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRanking();
    
    // ページめくりアニメーション
    if (notebookRef.current) {
      gsap.fromTo(notebookRef.current,
        { rotationY: 90, opacity: 0.5, transformOrigin: "left center" },
        { rotationY: 0, opacity: 1, duration: 0.6, ease: "back.out(1.2)", clearProps: "transform" }
      );
    }
  }, [activeTab]);

  useEffect(() => {
    if (rankings.length > 0 && listItemsRef.current.length > 0) {
      gsap.fromTo(listItemsRef.current, 
        { opacity: 0, y: 10 }, 
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.3, 
          stagger: 0.03, 
          ease: 'power2.out',
          overwrite: true
        }
      );
    }
  }, [rankings]);

  const tabs = [
    { id: 'overall', title: '総合', icon: '🏆', color: 'bg-[#fef08a]', activeColor: 'bg-[#fde047]', shadow: 'shadow-yellow-500/20' },
    { id: 'running', title: 'ラン', icon: '🐕', color: 'bg-[#fbcfe8]', activeColor: 'bg-[#f9a8d4]', shadow: 'shadow-pink-500/20' },
    { id: 'reversi', title: 'リバーシ', icon: '⚪', color: 'bg-[#bfdbfe]', activeColor: 'bg-[#93c5fd]', shadow: 'shadow-blue-500/20' },
    { id: 'mining', title: '採掘', icon: '⛏️', color: 'bg-[#bbf7d0]', activeColor: 'bg-[#86efac]', shadow: 'shadow-green-500/20' }
  ];

  return (
    <div className="flex flex-col h-full pb-v-xl" style={{ perspective: '1000px' }}>
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-xl font-black text-primary flex items-center gap-2 drop-shadow-sm">
          <Trophy size={24} className="text-accent" />
          Ranking
        </h2>
        <button 
          onClick={() => fetchRanking(true)}
          disabled={isLoading}
          className="p-2 rounded-full bg-surface text-primary hover:bg-surface/80 transition-colors disabled:opacity-50 shadow-sm"
          title="更新"
        >
          <RefreshCcw size={20} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="relative flex-1 flex flex-col mt-2">
        {/* タブナビゲーション（付箋） */}
        <div className="flex gap-1 px-4 z-10 relative -mb-1 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1 px-3 pt-3 pb-4 rounded-t-lg text-sm font-black transition-all duration-300 border-t border-x border-black/10 min-w-max ${
                  isActive
                    ? `${tab.activeColor} text-black shadow-[0_-4px_10px_rgba(0,0,0,0.1)] -translate-y-2 z-20`
                    : `${tab.color} text-black/70 hover:-translate-y-1 hover:text-black z-10`
                }`}
                style={{ transformOrigin: 'bottom center' }}
              >
                <span className="text-base drop-shadow-sm">{tab.icon}</span>
                {tab.title}
              </button>
            );
          })}
        </div>

        {/* ノート本体 */}
        <div 
          ref={notebookRef}
          className="bg-[#fdfbf7] rounded-2xl rounded-tl-none shadow-[2px_4px_16px_rgba(0,0,0,0.15)] border border-[#e4d5b7] flex-1 overflow-hidden flex flex-col relative z-20 ml-2 mr-1"
        >
          {/* ノートの装飾（左側の赤い線） */}
          <div className="absolute top-0 bottom-0 left-10 w-0.5 bg-red-400/30 z-0" />
          
          {/* バインダーの穴 */}
          <div className="absolute top-0 bottom-0 left-2 flex flex-col justify-around py-4 z-0 opacity-40">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="w-4 h-4 rounded-full bg-[#d1c5b4] shadow-inner border border-[#b8a992]" />
            ))}
          </div>

          {/* ノートの罫線背景 */}
          <div className="absolute inset-0 bg-[linear-gradient(transparent_47px,#e4d5b7_48px)] bg-[length:100%_48px] z-0 opacity-50 mt-2" />

          <div className="relative z-10 flex-1 flex flex-col overflow-hidden pl-12 pr-2 py-2">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center text-[#8b5a2b] font-bold">
                読み込み中...
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center text-red-500 font-bold">
                {error}
              </div>
            ) : rankings.length > 0 ? (
              <ul className="flex-1 overflow-y-auto space-y-0 pb-4">
                {rankings.map((entry, idx) => (
                  <li 
                    key={`${entry.rank}-${entry.playerName}`}
                    ref={(el) => { if (el) listItemsRef.current[idx] = el; }}
                    className="flex items-center justify-between h-[48px] px-2 hover:bg-black/5 transition-colors rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 flex items-center justify-center rounded-full font-black text-xs shadow-sm ${
                        idx === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900' : 
                        idx === 1 ? 'bg-gradient-to-br from-gray-200 to-gray-400 text-gray-800' : 
                        idx === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-500 text-orange-900' : 
                        'bg-transparent text-[#8b5a2b]'
                      }`}>
                        {entry.rank}
                      </div>
                      {entry.pfpUrl && (
                        <img src={entry.pfpUrl} alt={entry.playerName} className="w-8 h-8 rounded-full object-cover border border-[#e4d5b7] shadow-sm" referrerPolicy="no-referrer" />
                      )}
                      <div className="flex flex-col justify-center">
                        <span className="font-bold text-[#3e2723] text-sm leading-tight">{entry.playerName}</span>
                        {entry.username && <span className="text-[10px] text-[#795548] leading-tight">@{entry.username}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-center">
                      <div className="flex items-baseline gap-1">
                        <span className="font-mono font-black text-[#8b5a2b] text-base leading-tight">
                          {entry.score.toLocaleString()}
                        </span>
                        <span className="text-[9px] font-bold text-[#d97736] uppercase">
                          {activeTab === 'overall' ? 'CHH' : 'PTS'}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex-1 flex items-center justify-center text-[#8b5a2b] font-bold">
                まだ記録がありません
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
