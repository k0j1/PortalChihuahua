import React, { useEffect } from 'react';
import { BaseCampScreen } from './views/BaseCampScreen';
import sdk from '@farcaster/frame-sdk';

export default function App() {
  useEffect(() => {
    const init = async () => {
      try {
        await sdk.actions.ready();
      } catch (error) {
        console.error('Failed to initialize Farcaster SDK:', error);
      }
    };
    init();
  }, []);

  return (
    <div className="w-full min-h-screen bg-village font-village text-body overflow-hidden">
      <BaseCampScreen />
    </div>
  );
}
