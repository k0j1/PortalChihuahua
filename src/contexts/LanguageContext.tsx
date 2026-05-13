import React, { createContext, useContext, useState } from 'react';

type Language = 'en' | 'ja';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, ...args: string[]) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'home': 'Home',
    'ranking': 'Ranking',
    'activity': 'Activity',
    'maintenance': 'Under Maintenance',
    'maintenance_desc': 'We are currently undergoing maintenance to add new features and tune the system. Please wait for a while until it is completed.',
    'loading': 'Loading...',
    'unknown': 'Unknown',
    'farcaster_account': 'Farcaster Account',
    'account_id': 'Account ID',
    'connected_wallet': 'Connected Wallet',
    'total_points': 'Total Points',
    'game_stats': 'Game Stats',
    'no_stats': 'No stats available',
    'total_treasures': 'Total Treasures',
    'total_chh': 'Total CHH',
    'recent_activity': 'Recent Activity',
    'close': 'Close',
    'language': 'Language',
    'address': 'Wallet Address',
    'no_address': 'Not connected',
    'overall': 'Overall',
    
    // DashboardView
    'guest_cannot_share': 'Guest users cannot share.',
    'share_copied': 'Share link copied to clipboard!\n',
    'share_status': 'Share Status',
    'guest_user': 'Guest User',
    'chh_balance': '$CHH Balance',
    'total_reward': 'Total Reward',
    'overall_rank': 'Overall Rank',
    'game_list': 'Game List',
    'start': 'START',
    
    // RankingView
    'refresh': 'Refresh',
    'no_records': 'No records yet',
    'failed_to_fetch_ranking': 'Failed to fetch ranking',
    'reward': 'Reward',
    'running': 'Running',
    'reversi': 'Reversi',
    'mining': 'Mining',
    'th': 'th',
    'st': 'st',
    'nd': 'nd',
    'rd': 'rd',

    // ActivityView
    'activity_desc': 'Displaying latest activities from smart contract history.',
    'search_placeholder': 'Search by username, game, action...',
    'no_activity': 'No activity found',
    'failed_to_fetch_activity': 'Failed to fetch activity',
    'received_score_reward': 'Received {0} CHH as a score reward',
    'received_login_bonus': 'Received {0} CHH as a login bonus',
    'paid_item_purchase': 'Paid {0} CHH for an item purchase',
    'received_quest_reward': 'Received {0} CHH as a quest reward',
    'paid_gacha_purchase': 'Paid {0} CHH for a gacha purchase',
    'paid_quest_departure': 'Paid {0} CHH for a quest departure',
    'paid_in_game': 'Paid {0} CHH for an in-game payment',
    'received_reward': 'Received {0} CHH as a reward',
    'transaction_sent': '{0} was sent',
    'unknown_time': 'Unknown time',
    'unknown_game': 'Unknown game',
    'tx_sent': 'Transaction sent',
    'error_occurred': 'An error occurred',
    
    // Games
    'game_running_title': 'Running Chihuahua',
    'game_running_desc': 'Dodge obstacles and keep running in this action game!',
    'game_reversi_title': 'Reversi',
    'game_reversi_desc': 'The classic board game. Battle of wits with Chihuahua!',
    'game_mining_title': 'Mining Quest',
    'game_mining_desc': 'Dig deep underground in search of treasure!',
    'game_quest_title': 'Chihuahua Quest',
    'game_quest_desc': 'Embark on an epic adventure! Full-scale Chihuahua RPG.',
  },
  ja: {
    'home': 'ホーム',
    'ranking': 'ランキング',
    'activity': 'アクティビティ',
    'maintenance': 'メンテナンス中',
    'maintenance_desc': '現在、新機能の追加とシステム調整のためメンテナンスを行っております。完了まで今しばらくお待ちください。',
    'loading': '読み込み中...',
    'unknown': '不明',
    'farcaster_account': 'Farcaster アカウント',
    'account_id': 'アカウント ID',
    'connected_wallet': '接続済みウォレット',
    'total_points': '総ポイント',
    'game_stats': 'ゲームステータス',
    'no_stats': 'ステータスなし',
    'total_treasures': '総財宝数',
    'total_chh': '総CHH',
    'recent_activity': '最近のアクティビティ',
    'close': '閉じる',
    'language': '言語 (Language)',
    'address': 'ウォレットアドレス',
    'no_address': '未接続',
    'overall': '総合',

    // DashboardView
    'guest_cannot_share': 'ゲストユーザーは共有できません。',
    'share_copied': '共有リンクをクリップボードにコピーしました！\n',
    'share_status': 'ステータスを共有',
    'guest_user': 'Guest User',
    'chh_balance': '$CHH保有枚数',
    'total_reward': '総合リワード',
    'overall_rank': '総合ランク',
    'game_list': 'ゲームリスト',
    'start': 'START',
    
    // RankingView
    'refresh': '更新',
    'no_records': 'まだ記録がありません',
    'failed_to_fetch_ranking': 'ランキングの取得に失敗しました',
    'reward': 'Reward',
    'running': 'Running',
    'reversi': 'Reversi',
    'mining': 'Mining',
    'th': '位',
    'st': '位',
    'nd': '位',
    'rd': '位',

    // ActivityView
    'activity_desc': 'スマートコントラクトの履歴から最新の活動を表示しています。',
    'search_placeholder': 'ユーザー名、ゲーム、アクションで検索...',
    'no_activity': 'アクティビティがありません',
    'failed_to_fetch_activity': 'エラーが発生しました',
    'received_score_reward': 'スコア報酬として{0}CHHを獲得しました',
    'received_login_bonus': 'ログインボーナスとして{0}CHHを獲得しました',
    'paid_item_purchase': 'アイテム購入として{0}CHHを支払いました',
    'received_quest_reward': 'クエスト報酬として{0}CHHを獲得しました',
    'paid_gacha_purchase': 'ガチャ購入として{0}CHHを支払いました',
    'paid_quest_departure': 'クエスト出発として{0}CHHを支払いました',
    'paid_in_game': 'ゲーム内での支払いとして{0}CHHを支払いました',
    'received_reward': '報酬として{0}CHHを獲得しました',
    'transaction_sent': '{0} が送信されました',
    'unknown_time': '不明な時間',
    'unknown_game': '不明なゲーム',
    'tx_sent': 'トランザクション',
    'error_occurred': 'エラーが発生しました',

    // Games
    'game_running_title': 'ランニングチワワ',
    'game_running_desc': '障害物を避けて走り続けるアクションゲーム！',
    'game_reversi_title': 'リバーシ',
    'game_reversi_desc': '定番のボードゲーム。チワワと一緒に頭脳戦！',
    'game_mining_title': 'マイニングクエスト',
    'game_mining_desc': 'お宝を求めて地下深くへ掘り進め！',
    'game_quest_title': 'チワワクエスト',
    'game_quest_desc': '壮大な冒険に出発！チワワの本格RPG。',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string, ...args: string[]) => {
    let str = translations[language][key] || key;
    args.forEach((arg, index) => {
      str = str.replace(`{${index}}`, arg);
    });
    return str;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
