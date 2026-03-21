import React from 'react';
import { UserProfile } from '../../models/UserProfile';

interface HeaderProps {
  user: UserProfile | null;
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  return (
    <header 
      className="fixed top-0 left-0 right-0 z-40 bg-primary text-white shadow-v-lg border-b border-[#3e2723]/50 h-16 flex items-center"
    >
      <div className="w-full flex items-center justify-between px-6 relative overflow-hidden">
        <h1 className="text-lg font-black tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] relative z-10">
          ChihuahuaStatus
        </h1>
        <div className="flex items-center gap-v-sm relative z-10">
          <span className="text-xs font-bold opacity-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{user?.name || 'Guest'}</span>
          <div 
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
