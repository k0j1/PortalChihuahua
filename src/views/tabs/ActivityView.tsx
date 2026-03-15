import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { getRecentLogs } from '../../services/blockchainService';
import { ActivityLog } from '../../models/ActivityLog';
import { Activity, ExternalLink } from 'lucide-react';

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
        // Map raw logs to ActivityLog objects
        const formattedLogs = rawLogs.map((log: any, idx: number) => new ActivityLog(
          log.transactionHash,
          '匿名ユーザー',
          'https://picsum.photos/seed/user/50/50',
          'スマートコントラクト',
          'コントラクトが実行されました',
          new Date().toLocaleTimeString(),
          log.transactionHash
        ));
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
          <ul className="flex-1 overflow-y-auto p-v-sm space-y-v-sm">
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
                      href={`#tx/${log.txHash}`} 
                      className="inline-flex items-center gap-1 text-xs text-secondary hover:text-primary transition-colors"
                      onClick={(e) => e.preventDefault()}
                    >
                      <ExternalLink size={12} />
                      {log.txHash}
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
