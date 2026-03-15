import React from 'react';
import { motion } from 'motion/react';
import { VillageMap } from '../components/village/VillageMap';
import { Button } from '../components/ui/Button';
import { ArrowLeft } from 'lucide-react';

interface VillageScreenProps {
  onBack: () => void;
}

export const VillageScreen: React.FC<VillageScreenProps> = ({ onBack }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col min-h-screen bg-village"
    >
      <header className="flex items-center justify-between p-v-md bg-primary text-inverse shadow-v-md safe-area-pt">
        <Button variant="outline" size="sm" onClick={onBack} className="border-inverse text-inverse hover:bg-inverse hover:text-primary">
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-xl font-bold">チワワ村</h1>
        <div className="w-10" /> {/* バランス用 */}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-v-md overflow-hidden safe-area-pb">
        <p className="mb-v-md text-center text-body font-medium bg-surface/80 px-v-md py-v-sm rounded-v-full shadow-v-sm backdrop-blur-sm">
          十字キーで移動して、施設に入ろう！
        </p>
        
        <VillageMap />
      </main>
    </motion.div>
  );
};
