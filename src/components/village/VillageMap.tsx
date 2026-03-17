import React, { useState, useEffect, useCallback, useRef } from 'react';
import gsap from 'gsap';
import { MapData, TileType } from '../../models/MapData';
import { GameService } from '../../services/GameService';
import { GameInfo } from '../../models/GameInfo';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Home, Trophy, Play } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { RankingEntry } from '../../models/RankingEntry';

export const VillageMap: React.FC = () => {
  const [pos, setPos] = useState({ x: 3, y: 3 });
  const [direction, setDirection] = useState<'up' | 'down' | 'left' | 'right'>('down');
  const [activeFacility, setActiveFacility] = useState<GameInfo | null>(null);
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const characterRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  const gameService = GameService.getInstance();
  const games = gameService.getGames();

  useEffect(() => {
    if (characterRef.current) {
      const tileSize = window.innerWidth < 640 ? 48 : 64;
      const targetX = pos.x * tileSize + 8;
      const targetY = pos.y * tileSize + 8;

      if (isFirstRender.current) {
        gsap.set(characterRef.current, { x: targetX, y: targetY });
        isFirstRender.current = false;
      } else {
        gsap.to(characterRef.current, {
          x: targetX,
          y: targetY,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    }
  }, [pos]);

  const move = useCallback((dx: number, dy: number, newDir: 'up' | 'down' | 'left' | 'right') => {
    setDirection(newDir);
    const newX = pos.x + dx;
    const newY = pos.y + dy;

    if (MapData.isWalkable(newX, newY)) {
      setPos({ x: newX, y: newY });
      
      const facilityId = MapData.getFacilityId(newX, newY);
      if (facilityId) {
        const game = games.find(g => g.id === facilityId);
        if (game) {
          setActiveFacility(game);
          fetchRanking(game.id);
        }
      } else {
        setActiveFacility(null);
      }
    }
  }, [pos, games]);

  const fetchRanking = async (gameId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await gameService.getRanking(gameId);
      setRankings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // キーボード操作
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeFacility) return; // モーダルが開いている時は移動しない
      switch (e.key) {
        case 'ArrowUp': move(0, -1, 'up'); break;
        case 'ArrowDown': move(0, 1, 'down'); break;
        case 'ArrowLeft': move(-1, 0, 'left'); break;
        case 'ArrowRight': move(1, 0, 'right'); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move, activeFacility]);

  // タイルの描画
  const renderTile = (x: number, y: number, type: TileType) => {
    let bgColor = 'bg-village';
    let content = null;

    if (type === TileType.OBSTACLE) {
      bgColor = 'bg-secondary opacity-50'; // 木の表現
      content = <div className="w-full h-full rounded-v-full bg-secondary opacity-80 scale-75" />;
    } else if (type === TileType.PATH) {
      bgColor = 'bg-[#e6d5b8]'; // 道の色
    } else {
      // 施設
      const facilityId = MapData.getFacilityId(x, y);
      const game = games.find(g => g.id === facilityId);
      if (game) {
        bgColor = 'bg-surface';
        content = (
          <div className="flex flex-col items-center justify-center w-full h-full border-2 border-primary rounded-v-sm" style={{ borderColor: game.color }}>
            <Home size={20} color={game.color} />
          </div>
        );
      }
    }

    return (
      <div key={`${x}-${y}`} className={`w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center ${bgColor} border border-black/5`}>
        {content}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto">
      <div className="relative bg-village p-v-sm rounded-v-lg shadow-v-md border-4 border-primary overflow-hidden">
        {/* マップグリッド */}
        <div className="grid grid-cols-7 gap-0">
          {MapData.LAYOUT.map((row, y) => 
            row.map((tile, x) => renderTile(x, y, tile))
          )}
        </div>

        {/* チワワキャラクター */}
        <div
          ref={characterRef}
          className="absolute w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center z-10"
        >
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 bg-accent rounded-v-full shadow-v-sm flex items-center justify-center border-2 border-primary">
            {/* チワワの顔の簡易表現 */}
            <div className="absolute top-1 left-1 w-2 h-2 bg-white rounded-v-full" />
            <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-v-full" />
            <div className="absolute top-1.5 left-1.5 w-1 h-1 bg-black rounded-v-full" />
            <div className="absolute top-1.5 right-1.5 w-1 h-1 bg-black rounded-v-full" />
            <div className="absolute bottom-2 w-2 h-1.5 bg-black rounded-v-full" />
            {/* 耳 */}
            <div className="absolute -top-2 -left-1 w-3 h-4 bg-accent rounded-t-full transform -rotate-12 border border-primary" />
            <div className="absolute -top-2 -right-1 w-3 h-4 bg-accent rounded-t-full transform rotate-12 border border-primary" />
          </div>
        </div>
      </div>

      {/* D-Pad (モバイル向け十字キー) */}
      <div className="mt-v-lg grid grid-cols-3 gap-v-sm">
        <div />
        <Button variant="secondary" onClick={() => move(0, -1, 'up')} aria-label="上へ移動" className="w-14 h-14 rounded-v-full">
          <ArrowUp size={24} />
        </Button>
        <div />
        <Button variant="secondary" onClick={() => move(-1, 0, 'left')} aria-label="左へ移動" className="w-14 h-14 rounded-v-full">
          <ArrowLeft size={24} />
        </Button>
        <Button variant="primary" onClick={() => {}} aria-label="アクション" className="w-14 h-14 rounded-v-full">
          <div className="w-4 h-4 bg-white rounded-v-full opacity-50" />
        </Button>
        <Button variant="secondary" onClick={() => move(1, 0, 'right')} aria-label="右へ移動" className="w-14 h-14 rounded-v-full">
          <ArrowRight size={24} />
        </Button>
        <div />
        <Button variant="secondary" onClick={() => move(0, 1, 'down')} aria-label="下へ移動" className="w-14 h-14 rounded-v-full">
          <ArrowDown size={24} />
        </Button>
        <div />
      </div>

      {/* 施設モーダル */}
      <Modal
        isOpen={!!activeFacility}
        onClose={() => {
          setActiveFacility(null);
          // 施設から一歩戻る (簡易的な処理)
          if (pos.y === 0) move(0, 1, 'down');
          else if (pos.y === 6) move(0, -1, 'up');
          else if (pos.x === 0) move(1, 0, 'right');
          else if (pos.x === 6) move(-1, 0, 'left');
        }}
        title={activeFacility?.title || ''}
      >
        {activeFacility && (
          <div className="flex flex-col gap-v-md">
            <p className="text-body">{activeFacility.description}</p>
            
            <div className="bg-village p-v-sm rounded-v-md border border-surface">
              <h3 className="font-bold text-primary flex items-center gap-2 mb-v-sm">
                <Trophy size={18} />
                ランキング
              </h3>
              
              {isLoading ? (
                <div className="text-center py-v-md text-light">読み込み中...</div>
              ) : error ? (
                <div className="text-center py-v-md text-red-500">{error}</div>
              ) : rankings.length > 0 ? (
                <ul className="space-y-2">
                  {rankings.map((entry, idx) => (
                    <li key={idx} className="flex items-center justify-between bg-surface p-v-sm rounded-v-sm shadow-v-sm">
                      <div className="flex items-center gap-3">
                        <span className={`font-bold ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-orange-400' : 'text-light'}`}>
                          {entry.rank}位
                        </span>
                        <span className="font-bold text-body">{entry.playerName}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-mono font-bold text-primary">{entry.score.toLocaleString()}</span>
                        <span className="text-xs text-light">{entry.date}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-v-md text-light">まだ記録がありません</div>
              )}
            </div>

            <Button 
              variant="primary" 
              className="w-full mt-v-sm flex items-center justify-center gap-2"
              onClick={() => window.open(activeFacility.url, '_blank')}
            >
              <Play size={18} />
              ゲームをプレイする
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
