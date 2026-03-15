import React, { useEffect, useState } from 'react';
import { BaseCampScreen } from './views/BaseCampScreen';
import sdk from '@farcaster/frame-sdk';

export default function App() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await sdk.context;
        await sdk.actions.ready();
      } catch (error) {
        console.error('Failed to initialize Farcaster SDK:', error);
      } finally {
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
