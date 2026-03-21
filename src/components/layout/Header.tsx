import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { UserProfile } from '../../models/UserProfile';

interface HeaderProps {
  user: UserProfile | null;
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  const headerRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (headerRef.current && titleRef.current && avatarRef.current) {
      const tl = gsap.timeline();
      
      tl.fromTo(headerRef.current,
        { y: -100, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'back.out(1.5)' }
      )
      .fromTo(titleRef.current,
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' },
        "-=0.2"
      )
      .fromTo(avatarRef.current,
        { scale: 0, rotation: -180 },
        { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(2)' },
        "-=0.3"
      );

      // キラキラ光るエフェクト
      gsap.to(headerRef.current, {
        boxShadow: '0 4px 20px rgba(217, 119, 54, 0.4)',
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    }
  }, []);

  return (
    <header 
      ref={headerRef}
      className="fixed top-0 left-0 right-0 z-40 bg-primary text-white shadow-v-lg safe-area-pt border-b border-[#3e2723]/50"
    >
      <div className="flex items-center justify-between px-6 py-4 relative overflow-hidden">
        <h1 ref={titleRef} className="text-lg font-black tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] relative z-10">
          ChihuahuaStatus
        </h1>
        <div className="flex items-center gap-v-sm relative z-10">
          <span className="text-xs font-bold opacity-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{user?.name || 'Guest'}</span>
          <div 
            ref={avatarRef}
            className="w-8 h-8 rounded-v-full overflow-hidden border-2 border-white/80 bg-village flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)]"
          >
            {user?.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt="Avatar" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-sm">👤</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
