import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
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
  }, [activeTab]);

  const tabs = [
    { id: 'overall', title: '総合リワード', icon: '🏆' },
    { id: 'running', title: 'ランニング', icon: '🐕' },
    { id: 'reversi', title: 'リバーシ', icon: '⚪' },
    { id: 'mining', title: 'マイニング', icon: '⛏️' }
  ];

  return (
    <div className="flex flex-col h-full pb-v-xl">
      <div className="flex items-center justify-between mb-v-md">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <Trophy size={24} className="text-accent" />
          ランキング
        </h2>
        <button 
          onClick={() => fetchRanking(true)}
          disabled={isLoading}
          className="p-2 rounded-full bg-surface text-primary hover:bg-surface/80 transition-colors disabled:opacity-50"
          title="更新"
        >
          <RefreshCcw size={20} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* タブナビゲーション */}
      <div className="bg-village/30 p-v-sm rounded-v-2xl mb-v-lg overflow-x-auto hide-scrollbar border border-surface/30">
        <div className="flex gap-v-sm min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-v-xl py-v-md rounded-v-xl text-sm font-black transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-primary text-inverse shadow-v-lg scale-105 z-10 ring-2 ring-accent/30'
                  : 'bg-surface/50 text-light hover:bg-surface hover:text-body border border-surface/50'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.title}
            </button>
          ))}
        </div>
      </div>

      {/* ランキングリスト */}
      <div className="bg-surface rounded-v-lg shadow-v-md border border-surface flex-1 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-light p-v-lg">
            読み込み中...
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-red-500 p-v-lg">
            {error}
          </div>
        ) : rankings.length > 0 ? (
          <ul className="flex-1 overflow-y-auto p-v-md space-y-3">
            {rankings.map((entry, idx) => (
              <motion.li 
                key={`${entry.rank}-${entry.playerName}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between bg-village p-v-md rounded-v-md border border-surface/50"
              >
                <div className="flex items-center gap-v-md">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-v-full font-black text-sm ${
                    idx === 0 ? 'bg-yellow-400 text-yellow-900' : 
                    idx === 1 ? 'bg-gray-300 text-gray-800' : 
                    idx === 2 ? 'bg-orange-300 text-orange-900' : 
                    'bg-surface text-light'
                  }`}>
                    {entry.rank}
                  </div>
                  {entry.pfpUrl && (
                    <img src={entry.pfpUrl} alt={entry.playerName} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                  )}
                  <div className="flex flex-col">
                    <span className="font-bold text-body">{entry.playerName}</span>
                    {entry.username && <span className="text-xs text-light">@{entry.username}</span>}
                  </div>
                </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-baseline gap-1">
                      <span className="font-mono font-black text-primary text-xl">
                        {entry.score.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-bold text-accent uppercase">
                        {activeTab === 'overall' ? 'CHH' : 'PTS'}
                      </span>
                    </div>
                    <span className="text-[10px] text-light/70">{entry.date}</span>
                  </div>
              </motion.li>
            ))}
          </ul>
        ) : (
          <div className="flex-1 flex items-center justify-center text-light p-v-lg">
            まだ記録がありません
          </div>
        )}
      </div>
    </div>
  );
};
