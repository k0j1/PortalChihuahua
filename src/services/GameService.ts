import { GameInfo } from '../models/GameInfo';
import { RankingEntry } from '../models/RankingEntry';
import { UserProfile } from '../models/UserProfile';
import { ActivityLog } from '../models/ActivityLog';
import { supabase } from './supabaseClient';

export class GameService {
  private static instance: GameService;

  private constructor() {}

  public static getInstance(): GameService {
    if (!GameService.instance) {
      GameService.instance = new GameService();
    }
    return GameService.instance;
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
        '#d97736'
      ),
      new GameInfo(
        'reversi',
        'リバーシ',
        'https://reversi.k0j1.v2002.coreserver.jp/',
        'https://farcaster.xyz/miniapps/FYXr6t3KSLwo/reversi',
        '定番のボードゲーム。チワワと一緒に頭脳戦！',
        'Circle',
        'https://reversi.k0j1.v2002.coreserver.jp/images/icon.png',
        '#4a7c59'
      ),
      new GameInfo(
        'mining',
        'マイニングクエスト',
        'https://miningquest.k0j1.v2002.coreserver.jp/',
        'https://farcaster.xyz/miniapps/MR1ItBAqMlzR/mining-quest',
        'お宝を求めて地下深くへ掘り進め！',
        'Pickaxe',
        'https://miningquest.k0j1.v2002.coreserver.jp/images/icon.png',
        '#795548'
      ),
      new GameInfo(
        'quest',
        'チワワクエスト',
        'https://chihuahuaquest.k0j1.v2002.coreserver.jp/',
        'https://farcaster.xyz/miniapps/EnmWQ9uvTlHa/chihuahuaquest',
        '壮大な冒険に出発！チワワの本格RPG。',
        'Sword',
        'https://chihuahuaquest.k0j1.v2002.coreserver.jp/images/icon.png',
        '#8b5a2b'
      )
    ];
  }

  public async getUserProfile(): Promise<UserProfile | null> {
    const urlParams = new URLSearchParams(window.location.search);
    const fidParam = urlParams.get('fid');
    
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
        supabase.from('reversi_player_stats').select('*').eq('fid', fid).single(),
        supabase.from('quest_player_stats').select('*').eq('fid', fid).single()
      ]);

      // Calculate Reversi wins
      let reversiWins = 0;
      if (reversiRes.data) {
        const levels = ['level_1', 'level_2', 'level_3', 'level_4', 'level_5'];
        levels.forEach(lvl => {
          const stats = reversiRes.data[lvl];
          if (stats && typeof stats === 'object') {
            reversiWins += (stats as any).win || 0;
          }
        });
      }

      // Calculate total score (same logic as RankingView)
      const runningScore = (runningRes.data?.total_score || 0) * 0.05;
      const reversiScore = reversiRes.data?.claimed_score || 0;
      const miningScore = questRes.data?.total_reward || 0;
      const totalScore = Math.floor(runningScore + reversiScore + miningScore);

      return new UserProfile(
        userData.fid.toString(),
        userData.display_name || userData.username || 'Unknown',
        userData.username || '',
        `@${userData.username || 'unknown'}`,
        userData.pfp_url || 'https://picsum.photos/seed/chihuahua/100/100',
        '🐶',
        totalScore,
        0, // Rank will be calculated or fetched separately if needed
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
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          new RankingEntry(1, 'キングチワワ', 99999, '2026-03-14'),
          new RankingEntry(2, 'ポチ', 85000, '2026-03-13'),
          new RankingEntry(3, 'ハチ', 72000, '2026-03-12'),
          new RankingEntry(4, 'シロ', 64000, '2026-03-11'),
          new RankingEntry(5, 'クロ', 58000, '2026-03-10'),
        ]);
      }, 500);
    });
  }

  public async getActivityLogs(): Promise<ActivityLog[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          new ActivityLog('log_1', 'ポチ', 'https://picsum.photos/seed/pochi/50/50', 'mining', 'レア鉱石「オリハルコン」を発見！', '10分前', '0x1234...abcd'),
          new ActivityLog('log_2', 'ハチ', 'https://picsum.photos/seed/hachi/50/50', 'running', '自己ベスト更新！(15,000m)', '30分前', '0x5678...efgh'),
          new ActivityLog('log_3', 'シロ', 'https://picsum.photos/seed/shiro/50/50', 'reversi', '10連勝を達成！', '1時間前', '0x9abc...ijkl'),
          new ActivityLog('log_4', 'クロ', 'https://picsum.photos/seed/kuro/50/50', 'quest', '魔王を討伐しました！', '2時間前', '0xdef0...mnop'),
          new ActivityLog('log_5', 'ChihuahuaLover', 'https://picsum.photos/seed/chihuahua/50/50', 'mining', '初めての採掘に成功！', '3時間前', '0x1111...2222'),
        ]);
      }, 500);
    });
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
