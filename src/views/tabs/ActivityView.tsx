import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { getRecentLogs } from '../../services/blockchainService';
import { ActivityLog } from '../../models/ActivityLog';
import { Activity, ExternalLink } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

export const ActivityView: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const rawLogs = await getRecentLogs();
        
        const fromContracts = [
          '0x65f5661319c4d23c973c806e1e006bb06d5557d2',
          '0x9b9191f213afe0588570028174c97b3751c20db0',
          '0x38156db0e482eb3a5c198d49917fdb6746344db1',
          '0x193708bb0ac212e59fc44d6d6f3507f25bc97fd4'
        ];

        const toContracts = [
          '0x29521909c3b09bd7861fad32a49d12414c296c5a',
          '0xade81d78b1380b3153bbc1c16116b890fce41d00',
          '0xdde103f5bbf19f0f5d177be983c76e2a16d36416',
          '0x0d013d7dc17e8240595778d1db7241f176ca51f9'
        ];

        const getUserAddress = (log: any) => {
          const from = log.from?.toLowerCase() || '';
          const to = log.to?.toLowerCase() || '';
          if (fromContracts.includes(from)) return to;
          if (toContracts.includes(to)) return from;
          return from;
        };

        const getContractAddress = (log: any) => {
          const from = log.from?.toLowerCase() || '';
          const to = log.to?.toLowerCase() || '';
          if (fromContracts.includes(from)) return from;
          if (toContracts.includes(to)) return to;
          return to;
        };

        // Extract unique addresses from logs
        const addresses = [...new Set(rawLogs.map(getUserAddress))];
        
        // Fetch user profiles from Supabase farcaster_users table (case-insensitive)
        const userProfiles: any[] = [];
        const chunkSize = 20;
        
        for (let i = 0; i < addresses.length; i += chunkSize) {
          const chunk = addresses.slice(i, i + chunkSize);
          const orQuery = chunk.map(addr => `address.ilike.${addr}`).join(',');
          
          const { data, error: supabaseError } = await supabase
            .from('farcaster_users')
            .select('address, display_name, pfp_url')
            .or(orQuery);
            
          if (supabaseError) {
            console.error('Supabase error fetching profiles chunk:', supabaseError);
          } else if (data) {
            userProfiles.push(...data);
          }
        }
        
        // Create a map for quick lookup
        const profileMap = new Map<string, { display_name: string, pfp_url: string }>();
        userProfiles?.forEach(profile => {
          if (profile.address) {
            profileMap.set(profile.address.toLowerCase(), {
              display_name: profile.display_name,
              pfp_url: profile.pfp_url
            });
          }
        });

        // Map Alchemy AssetTransfersResult to ActivityLog objects
        const formattedLogs = rawLogs.map((log: any) => {
          const contractNames: Record<string, string> = {
            '0x65f5661319c4d23c973c806e1e006bb06d5557d2': 'RunningChihuahua',
            '0x9b9191f213afe0588570028174c97b3751c20db0': 'RunningChihuahua',
            '0x0d013d7dc17e8240595778d1db7241f176ca51f9': 'RunningChihuahua',
            '0x38156db0e482eb3a5c198d49917fdb6746344db1': 'Reversi',
            '0x193708bb0ac212e59fc44d6d6f3507f25bc97fd4': 'MiningQuest',
            '0x29521909c3b09bd7861fad32a49d12414c296c5a': 'MiningQuest',
            '0xade81d78b1380b3153bbc1c16116b890fce41d00': 'MiningQuest',
            '0xdde103f5bbf19f0f5d177be983c76e2a16d36416': 'MiningQuest'
          };

          const actionTexts: Record<string, (val: string) => string> = {
            '0x65f5661319c4d23c973c806e1e006bb06d5557d2': (val) => `スコア報酬として${val}CHHを獲得しました`,
            '0x9b9191f213afe0588570028174c97b3751c20db0': (val) => `ログインボーナスとして${val}CHHを獲得しました`,
            '0x0d013d7dc17e8240595778d1db7241f176ca51f9': (val) => `アイテム購入として${val}CHHを支払いました`,
            '0x38156db0e482eb3a5c198d49917fdb6746344db1': (val) => `ログインボーナスとして${val}CHHを獲得しました`,
            '0x193708bb0ac212e59fc44d6d6f3507f25bc97fd4': (val) => `クエスト報酬として${val}CHHを獲得しました`,
            '0x29521909c3b09bd7861fad32a49d12414c296c5a': (val) => `アイテム購入として${val}CHHを支払いました`,
            '0xade81d78b1380b3153bbc1c16116b890fce41d00': (val) => `ガチャ購入として${val}CHHを支払いました`,
            '0xdde103f5bbf19f0f5d177be983c76e2a16d36416': (val) => `クエスト出発として${val}CHHを支払いました`
          };

          const contractAddress = getContractAddress(log);
          const gameId = contractNames[contractAddress] || 'Unknown Game';
          const timestamp = log.metadata?.blockTimestamp 
            ? new Date(log.metadata.blockTimestamp).toLocaleString('ja-JP', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit',
                hour: '2-digit', 
                minute: '2-digit' 
              })
            : '不明な時間';

          const userAddress = getUserAddress(log);
          const profile = profileMap.get(userAddress);
          
          const userName = profile?.display_name || `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
          const userAvatar = profile?.pfp_url || `https://picsum.photos/seed/${userAddress}/50/50`;

          const valStr = log.value ? log.value.toString() : '0';
          const actionText = actionTexts[contractAddress] 
            ? actionTexts[contractAddress](valStr)
            : `${log.value ? `${log.value} ${log.asset || 'ETH'}` : 'トランザクション'} が送信されました`;

          return new ActivityLog(
            log.hash,
            userName,
            userAvatar,
            gameId,
            actionText,
            timestamp,
            log.hash
          );
        });
        setLogs(formattedLogs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="flex flex-col h-full pb-v-xl">
      <h2 className="text-xl font-bold text-primary mb-v-md flex items-center gap-2">
        <Activity size={24} className="text-secondary" />
        アクティビティ
      </h2>
      <p className="text-sm text-light mb-v-md">
        スマートコントラクトの履歴から最新の活動を表示しています。
      </p>

      <div className="bg-surface rounded-v-lg shadow-v-md border border-surface flex-1 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-light p-v-lg">
            読み込み中...
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-red-500 p-v-lg">
            {error}
          </div>
        ) : logs.length > 0 ? (
          <ul className="flex-1 overflow-y-auto p-v-md space-y-v-md">
            {logs.map((log, idx) => (
              <motion.li 
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-village p-v-md rounded-v-md border border-surface/50 flex gap-v-md items-start"
              >
                <div className="w-10 h-10 rounded-v-full overflow-hidden flex-shrink-0 border-2 border-surface">
                  <img src={log.userAvatar} alt={log.userName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <span className="font-bold text-body truncate">{log.userName}</span>
                    <span className="text-xs text-light flex-shrink-0">{log.timestamp}</span>
                  </div>
                  <p className="text-sm text-body leading-snug mb-2">
                    <span className="font-medium text-primary">[{log.gameId}]</span> {log.action}
                  </p>
                  {log.txHash && (
                    <a 
                      href={`https://basescan.org/tx/${log.txHash}`} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-secondary hover:text-primary transition-colors"
                    >
                      <ExternalLink size={12} />
                      {log.txHash.slice(0, 10)}...{log.txHash.slice(-8)}
                    </a>
                  )}
                </div>
              </motion.li>
            ))}
          </ul>
        ) : (
          <div className="flex-1 flex items-center justify-center text-light p-v-lg">
            アクティビティがありません
          </div>
        )}
      </div>
    </div>
  );
};
