import React, { useEffect, useState } from 'react';
import { BaseCampScreen } from './views/BaseCampScreen';
import sdk from '@farcaster/miniapp-sdk';

// 管理者のFIDリスト
const ADMIN_FIDS = ['406233', '1379028'];
// メンテナンスモードのフラグ
const IS_MAINTENANCE = false;

export default function App() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [userFid, setUserFid] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      // Timeout to ensure the app loads even if the SDK hangs (e.g., in a regular browser)
      const timeoutId = setTimeout(() => {
        console.log('Farcaster SDK initialization timed out, proceeding...');
        setIsSDKLoaded(true);
      }, 3000);

      try {
        console.log('Initializing Farcaster SDK...');
        const context = await sdk.context;
        if (context?.user?.fid) {
          setUserFid(context.user.fid.toString());
        }
        await sdk.actions.ready();
        console.log('Farcaster SDK initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Farcaster SDK:', error);
      } finally {
        clearTimeout(timeoutId);
        setIsSDKLoaded(true);
      }
    };
    init();
  }, []);

  if (!isSDKLoaded) {
    return <div className="w-full min-h-screen bg-village flex items-center justify-center text-primary">Loading...</div>;
  }

  // メンテナンスモードの判定
  const isAdmin = userFid && ADMIN_FIDS.includes(userFid);
  if (IS_MAINTENANCE && !isAdmin) {
    return (
      <div className="w-full min-h-screen bg-village flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">🚧</span>
        </div>
        <h1 className="text-2xl font-black text-primary mb-4">メンテナンス中</h1>
        <p className="text-light max-w-xs">
          現在、新機能の追加とシステム調整のためメンテナンスを行っております。<br />
          完了まで今しばらくお待ちください。
        </p>
        <div className="mt-8 text-[10px] font-mono text-primary/30">
          FID: {userFid || 'Unknown'}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-village font-village text-body overflow-hidden">
      <BaseCampScreen />
    </div>
  );
}
