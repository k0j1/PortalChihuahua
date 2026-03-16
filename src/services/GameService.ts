import { GameInfo } from '../models/GameInfo';
import { RankingEntry } from '../models/RankingEntry';
import { UserProfile } from '../models/UserProfile';
import { ActivityLog } from '../models/ActivityLog';
import { supabase } from './supabaseClient';
import sdk from '@farcaster/frame-sdk';

export class GameService {
  private static instance: GameService;

  private constructor() {}

  private activityLogs: ActivityLog[] | null = null;
  private rankingCache: Record<string, RankingEntry[]> = {};

  public static getInstance(): GameService {
    if (!GameService.instance) {
      GameService.instance = new GameService();
    }
    return GameService.instance;
  }

  public setActivityLogs(logs: ActivityLog[]): void {
    this.activityLogs = logs;
  }

  public getActivityLogs(): ActivityLog[] | null {
    return this.activityLogs;
  }

  public clearActivityLogs(): void {
    this.activityLogs = null;
  }

  public setRankingCache(gameId: string, ranking: RankingEntry[]): void {
    this.rankingCache[gameId] = ranking;
  }

  public getRankingCache(gameId: string): RankingEntry[] | null {
    return this.rankingCache[gameId] || null;
  }

  public clearRankingCache(): void {
    this.rankingCache = {};
  }

  public getGames(): GameInfo[] {
    return [
      new GameInfo(
        'running',
        'ランニングチワワ',
        'https://runningchihuahua.k0j1.v2002.coreserver.jp/',
        'https://farcaster.xyz/miniapps/3Si5HSEtMpTX/running-chihuahua',
        '障害物を避けて走り続けるアクションゲーム！',
        'Dog',
        'https://runningchihuahua.k0j1.v2002.coreserver.jp/images/icon.png',
        '#d97736',
        '3Si5HSEtMpTX'
      ),
      new GameInfo(
        'reversi',
        'リバーシ',
        'https://reversi.k0j1.v2002.coreserver.jp/',
        'https://farcaster.xyz/miniapps/FYXr6t3KSLwo/reversi',
        '定番のボードゲーム。チワワと一緒に頭脳戦！',
        'Circle',
        'https://reversi.k0j1.v2002.coreserver.jp/images/icon.png',
        '#4a7c59',
        'FYXr6t3KSLwo'
      ),
      new GameInfo(
        'mining',
        'マイニングクエスト',
        'https://miningquest.k0j1.v2002.coreserver.jp/',
        'https://farcaster.xyz/miniapps/MR1ItBAqMlzR/mining-quest',
        'お宝を求めて地下深くへ掘り進め！',
        'Pickaxe',
        'https://miningquest.k0j1.v2002.coreserver.jp/images/icon.png',
        '#795548',
        'MR1ItBAqMlzR'
      ),
      new GameInfo(
        'quest',
        'チワワクエスト',
        'https://chihuahuaquest.k0j1.v2002.coreserver.jp/',
        'https://farcaster.xyz/miniapps/EnmWQ9uvTlHa/chihuahuaquest',
        '壮大な冒険に出発！チワワの本格RPG。',
        'Sword',
        'https://chihuahuaquest.k0j1.v2002.coreserver.jp/images/icon.png',
        '#8b5a2b',
        'EnmWQ9uvTlHa'
      )
    ];
  }

  public async getUserProfile(): Promise<UserProfile | null> {
    let fidParam: string | undefined;
    
    try {
      const context = await sdk.context;
      fidParam = context?.user?.fid?.toString();
    } catch (e) {
      console.error('Error getting sdk context:', e);
    }
    
    if (!fidParam) {
      const urlParams = new URLSearchParams(window.location.search);
      fidParam = urlParams.get('fid') || undefined;
    }
    
    if (!fidParam) return null;

    try {
      const fid = parseInt(fidParam);
      
      // Fetch user info
      const { data: userData, error: userError } = await supabase
        .from('farcaster_users')
        .select('*')
        .eq('fid', fid)
        .single();

      if (userError || !userData) return null;

      // Fetch game stats
      const [runningRes, reversiRes, questRes] = await Promise.all([
        supabase.from('running_player_stats').select('*').eq('fid', fid).single(),
        supabase.from('reversi_game_stats').select('*').eq('fid', fid).single(),
        supabase.from('quest_player_stats').select('*').eq('fid', fid).single()
      ]);

      // Calculate Reversi wins
      let reversiWins = 0;
      if (reversiRes.data) {
        const levels = ['level_1', 'level_2', 'level_3', 'level_4', 'level_5'];
        levels.forEach(lvl => {
          const stats = reversiRes.data[lvl];
          if (stats && typeof stats === 'object') {
            reversiWins += (stats as any).win || (stats as any).wins || 0;
          } else if (typeof stats === 'number') {
            // In case the column itself is just a number of wins
            reversiWins += stats;
          }
          
          // Also check if there are columns like level_1_wins
          const lvlWins = reversiRes.data[`${lvl}_wins`] || reversiRes.data[`${lvl}_win`];
          if (typeof lvlWins === 'number') {
            reversiWins += lvlWins;
          }
        });
        
        // If there is a total_wins column
        if (typeof reversiRes.data.total_wins === 'number') {
          reversiWins = reversiRes.data.total_wins;
        }
      }

      // Calculate total score (same logic as RankingView)
      const runningScore = (runningRes.data?.total_score || 0) * 0.05;
      const reversiScore = reversiRes.data?.claimed_score || 0;
      const miningScore = questRes.data?.total_reward || 0;
      const totalScore = Math.floor(runningScore + reversiScore + miningScore);

      // Get overall ranking to find user's rank
      const overallRanking = await this.getOverallRanking();
      const userRankEntry = overallRanking.find(entry => entry.username === userData.username);
      const overallRank = userRankEntry ? userRankEntry.rank : 0;

      return new UserProfile(
        userData.fid.toString(),
        userData.display_name || userData.username || 'Unknown',
        userData.username || '',
        `@${userData.username || 'unknown'}`,
        userData.pfp_url || 'https://picsum.photos/seed/chihuahua/100/100',
        '🐶',
        totalScore,
        overallRank,
        userData.custody_address || '',
        userData.fid.toString(),
        runningRes.data ? { runCount: runningRes.data.run_count || 0, stamina: runningRes.data.stamina || 0 } : undefined,
        { totalWins: reversiWins },
        questRes.data ? {
          questCount: questRes.data.quest_count || 0,
          gachaHeroCount: questRes.data.gacha_hero_count || 0,
          gachaEquipmentCount: questRes.data.gacha_equipment_count || 0,
          item01: questRes.data.item01 || 0,
          item02: questRes.data.item02 || 0,
          item03: questRes.data.item03 || 0
        } : undefined
      );
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  public async getOverallRanking(): Promise<RankingEntry[]> {
    try {
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

      return Object.values(aggregated)
        .sort((a, b) => b.score - a.score)
        .map((item, idx) => new RankingEntry(
          idx + 1,
          item.user?.display_name || item.user?.username || 'Unknown',
          Math.floor(item.score),
          '',
          item.user?.pfp_url,
          item.user?.username
        ));
    } catch (error) {
      console.error('Error fetching overall ranking:', error);
      return [];
    }
  }

  public async getRanking(gameId: string): Promise<RankingEntry[]> {
    // 実際のAPIがないため、モックデータを返す
    // エラー処理の要件を満たすため、try-catchでラップし、擬似的な遅延を入れる
    try {
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockRankings: Record<string, RankingEntry[]> = {
            'running': [
              new RankingEntry(1, 'ポチ', 15000, '2026-03-10'),
              new RankingEntry(2, 'ハチ', 12500, '2026-03-11'),
              new RankingEntry(3, 'タロ', 10000, '2026-03-12'),
            ],
            'reversi': [
              new RankingEntry(1, 'シロ', 64, '2026-03-09'),
              new RankingEntry(2, 'クロ', 58, '2026-03-10'),
              new RankingEntry(3, 'ブチ', 50, '2026-03-11'),
            ],
            'mining': [
              new RankingEntry(1, 'モグラ', 9999, '2026-03-01'),
              new RankingEntry(2, 'チワワ', 8500, '2026-03-05'),
              new RankingEntry(3, 'ダックス', 7200, '2026-03-08'),
            ],
            'quest': [
              new RankingEntry(1, '勇者チワワ', 999, '2026-02-28'),
              new RankingEntry(2, '戦士ポメ', 850, '2026-03-02'),
              new RankingEntry(3, '魔法使いパグ', 700, '2026-03-05'),
            ]
          };
          resolve(mockRankings[gameId] || []);
        }, 500);
      });
    } catch (error) {
      console.error('ランキングの取得に失敗しました', error);
      throw new Error('ランキングデータを読み込めませんでした。');
    }
  }
}
