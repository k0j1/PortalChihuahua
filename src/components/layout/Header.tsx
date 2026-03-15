import React from 'react';
import { UserProfile } from '../../models/UserProfile';

interface HeaderProps {
  user: UserProfile | null;
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-primary text-inverse shadow-v-md safe-area-pt">
      <div className="flex items-center justify-between px-v-md py-v-lg">
        <h1 className="text-lg font-bold tracking-tight">チワワの秘密基地</h1>
        <div className="flex items-center gap-v-sm">
          <span className="text-sm font-medium opacity-90">{user?.name || 'Guest'}</span>
          <div className="w-8 h-8 rounded-v-full overflow-hidden border-2 border-surface/20 bg-village flex items-center justify-center">
            {user?.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt="Avatar" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-lg">👤</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
