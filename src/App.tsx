import React, { useEffect, useState } from 'react';
import { BaseCampScreen } from './views/BaseCampScreen';
import sdk from '@farcaster/miniapp-sdk';

export default function App() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Timeout to ensure the app loads even if the SDK hangs (e.g., in a regular browser)
      const timeoutId = setTimeout(() => {
        console.log('Farcaster SDK initialization timed out, proceeding...');
        setIsSDKLoaded(true);
      }, 3000);

      try {
        console.log('Initializing Farcaster SDK...');
        await sdk.context;
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

  return (
    <div className="w-full min-h-screen bg-village font-village text-body overflow-hidden">
      <BaseCampScreen />
    </div>
  );
}
