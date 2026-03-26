import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { getRecentLogs } from '../../services/blockchainService';
import { ActivityLog } from '../../models/ActivityLog';
import { Activity, ExternalLink, RefreshCcw, Search } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { GameService } from '../../services/GameService';

export const ActivityView: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const listItemsRef = useRef<HTMLLIElement[]>([]);

  const fetchLogs = async (forceRefresh = false) => {
    const gameService = GameService.getInstance();
    const cachedLogs = gameService.getActivityLogs();

    if (!forceRefresh && cachedLogs) {
      setLogs(cachedLogs);
      return;
    }

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
        '0x5f07a1992cb9a652b262dead336e4202349b77f5',
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
        const tokenAddress = log.rawContract?.address?.toLowerCase() || '';
        const knownTokens = [
          '0xb0748f58befa009a42306c91e01ed9dd3378eb01',
          '0xade81d78b1380b3153bbc1c16116b890fce41d00',
          '0xdde103f5bbf19f0f5d177be983c76e2a16d36416'
        ];

        if (fromContracts.includes(from)) return from;
        if (to === '0x5f07a1992cb9a652b262dead336e4202349b77f5') {
          if (knownTokens.includes(tokenAddress)) return tokenAddress;
          return to;
        }
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
      let firstRouterLogLogged = false;
      const formattedLogs = rawLogs.map((log: any) => {
        const contractNames: Record<string, string> = {
          '0x65f5661319c4d23c973c806e1e006bb06d5557d2': 'RunningChihuahua',
          '0x9b9191f213afe0588570028174c97b3751c20db0': 'RunningChihuahua',
          '0x0d013d7dc17e8240595778d1db7241f176ca51f9': 'RunningChihuahua',
          '0x38156db0e482eb3a5c198d49917fdb6746344db1': 'Reversi',
          '0x193708bb0ac212e59fc44d6d6f3507f25bc97fd4': 'MiningQuest',
          '0xb0748f58befa009a42306c91e01ed9dd3378eb01': 'MiningQuest',
          '0xade81d78b1380b3153bbc1c16116b890fce41d00': 'MiningQuest',
          '0xdde103f5bbf19f0f5d177be983c76e2a16d36416': 'MiningQuest',
          '0x5f07a1992cb9a652b262dead336e4202349b77f5': 'MiningQuest'
        };

        const actionTexts: Record<string, (val: string) => string> = {
          '0x65f5661319c4d23c973c806e1e006bb06d5557d2': (val) => `スコア報酬として${val}CHHを獲得しました`,
          '0x9b9191f213afe0588570028174c97b3751c20db0': (val) => `ログインボーナスとして${val}CHHを獲得しました`,
          '0x0d013d7dc17e8240595778d1db7241f176ca51f9': (val) => `アイテム購入として${val}CHHを支払いました`,
          '0x38156db0e482eb3a5c198d49917fdb6746344db1': (val) => `ログインボーナスとして${val}CHHを獲得しました`,
          '0x193708bb0ac212e59fc44d6d6f3507f25bc97fd4': (val) => `クエスト報酬として${val}CHHを獲得しました`,
          '0xb0748f58befa009a42306c91e01ed9dd3378eb01': (val) => `アイテム購入として${val}CHHを支払いました`,
          '0xade81d78b1380b3153bbc1c16116b890fce41d00': (val) => `ガチャ購入として${val}CHHを支払いました`,
          '0xdde103f5bbf19f0f5d177BE983C76e2a16D36416': (val) => `クエスト出発として${val}CHHを支払いました`,
          '0x5f07a1992cb9a652b262dead336e4202349b77f5': (val) => `ゲーム内での支払いとして${val}CHHを支払いました`
        };

        const contractAddress = getContractAddress(log);

        // 0x5f07... のトランザクションをコンソールに最初の一件だけ表示
        if (contractAddress === '0x5f07a1992cb9a652b262dead336e4202349b77f5' && !firstRouterLogLogged) {
          console.log('First Router Transaction:', log);
          firstRouterLogLogged = true;
        }
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
      gameService.setActivityLogs(formattedLogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (logs.length > 0 && listItemsRef.current.length > 0) {
      gsap.fromTo(listItemsRef.current, 
        { opacity: 0, y: 10 }, 
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.4, 
          stagger: 0.05, 
          ease: 'power2.out',
          overwrite: true
        }
      );
    }
  }, [logs]);

  const filteredLogs = logs.filter(log => 
    log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.gameId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full pb-v-xl">
      <div className="flex items-center justify-between mb-v-md">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <Activity size={24} className="text-secondary" />
          アクティビティ
        </h2>
        <button 
          onClick={() => fetchLogs(true)}
          disabled={isLoading}
          className="p-2 rounded-full bg-surface text-primary hover:bg-surface/80 transition-colors disabled:opacity-50"
          title="更新"
        >
          <RefreshCcw size={20} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>
      
      <p className="text-sm text-light mb-v-md">
        スマートコントラクトの履歴から最新の活動を表示しています。
      </p>

      <div className="relative mb-v-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-light" />
        </div>
        <input
          type="text"
          placeholder="ユーザー名、ゲーム、アクションで検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-surface rounded-v-md bg-surface text-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      <div className="bg-surface rounded-v-lg shadow-v-md border border-surface flex-1 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-light p-v-lg">
            読み込み中...
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-red-500 p-v-lg">
            {error}
          </div>
        ) : filteredLogs.length > 0 ? (
          <ul className="flex-1 overflow-y-auto p-v-md space-y-v-md">
            {filteredLogs.map((log, idx) => (
              <li 
                key={log.id}
                ref={(el) => { if (el) listItemsRef.current[idx] = el; }}
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
              </li>
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
