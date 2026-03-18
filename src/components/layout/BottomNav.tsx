import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Home, Trophy, Activity } from 'lucide-react';

export type TabType = 'home' | 'ranking' | 'activity';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const navRef = useRef<HTMLElement>(null);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const tabs = [
    { id: 'home', label: 'HOME', icon: Home },
    { id: 'ranking', label: 'Ranking', icon: Trophy },
    { id: 'activity', label: 'Activity', icon: Activity },
  ] as const;

  // 初期表示アニメーション
  useEffect(() => {
    if (navRef.current) {
      gsap.fromTo(navRef.current,
        { y: 100, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'back.out(1.2)', delay: 0.2 }
      );
    }
  }, []);

  // タブ切り替えアニメーション
  useEffect(() => {
    const activeIndex = tabs.findIndex(t => t.id === activeTab);
    const activeEl = tabsRef.current[activeIndex];
    
    if (activeEl) {
      // アイコンのバウンスアニメーション
      const icon = activeEl.querySelector('svg');
      if (icon) {
        gsap.fromTo(icon,
          { y: 0, scale: 1 },
          { 
            y: -6, 
            scale: 1.2, 
            duration: 0.4, 
            ease: 'back.out(2)',
            onComplete: () => {
              gsap.to(icon, { y: 0, scale: 1.1, duration: 0.2, ease: 'power1.inOut' });
            }
          }
        );
      }
      
      // 背景のハイライトエフェクト
      const highlight = activeEl.querySelector('.tab-highlight');
      if (highlight) {
        gsap.fromTo(highlight,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.5)' }
        );
      }
    }
    
    // 非アクティブなタブのリセット
    tabsRef.current.forEach((el, idx) => {
      if (idx !== activeIndex && el) {
        const icon = el.querySelector('svg');
        const highlight = el.querySelector('.tab-highlight');
        if (icon) gsap.to(icon, { y: 0, scale: 1, duration: 0.2 });
        if (highlight) gsap.to(highlight, { scale: 0, opacity: 0, duration: 0.2 });
      }
    });
  }, [activeTab]);

  return (
    <nav 
      ref={navRef}
      className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-surface/50 shadow-[0_-4px_20px_rgba(139,90,43,0.1)] safe-area-pb overflow-hidden"
    >
      <div className="flex items-center justify-around relative">
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={el => tabsRef.current[index] = el}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center w-full py-3 transition-colors ${
                isActive ? 'text-accent' : 'text-light hover:text-primary'
              }`}
            >
              {/* アクティブ時の背景ハイライト */}
              <div className="tab-highlight absolute inset-1 bg-accent/10 rounded-xl -z-10 opacity-0 transform scale-0" />
              
              <Icon 
                size={22} 
                className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-accent drop-shadow-[0_0_8px_rgba(217,119,54,0.6)]' : 'opacity-70'}`} 
              />
              <span className={`text-[10px] mt-1 transition-all duration-300 ${isActive ? 'font-black tracking-wide' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
