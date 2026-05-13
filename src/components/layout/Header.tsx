import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../../models/UserProfile';
import { useLanguage } from '../../contexts/LanguageContext';
import { Globe, Wallet, Copy, Check } from 'lucide-react';

interface HeaderProps {
  user: UserProfile | null;
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  const { language, setLanguage, t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ja' : 'en');
  };

  const handleCopyWallet = () => {
    if (user?.walletAddress || user?.custodyAddress) {
      const address = user.walletAddress || user.custodyAddress;
      if (address) {
        navigator.clipboard.writeText(address);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    }
  };

  const currentAddress = user?.walletAddress || user?.custodyAddress;
  const displayAddress = currentAddress 
    ? `${currentAddress.slice(0, 6)}...${currentAddress.slice(-4)}`
    : t('no_address');

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-40 bg-primary text-white shadow-v-lg border-b border-[#3e2723]/50 h-16 flex items-center"
    >
      <div className="w-full flex items-center justify-between px-6 relative overflow-visible">
        <h1 className="text-lg font-black tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] relative z-10">
          ChihuahuaStatus
        </h1>
        <div className="flex items-center gap-v-sm relative z-10">
          <span className="text-xs font-bold opacity-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{user?.name || 'Guest'}</span>
          
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-8 h-8 rounded-v-full overflow-hidden border-2 border-white/80 bg-village flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-transform hover:scale-105"
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
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-surface rounded-v-lg shadow-xl border border-primary/20 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-4 bg-primary text-white flex flex-col gap-1">
                  <span className="font-bold">{user?.name || 'Guest'}</span>
                  {user?.username && <span className="text-xs opacity-80">@{user.username}</span>}
                </div>
                
                <div className="p-3 flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-light uppercase font-bold flex items-center gap-1">
                      <Wallet size={12} />
                      {t('address')}
                    </span>
                    <div className="flex items-center justify-between bg-village p-2 rounded-md border border-surface/50">
                      <span className="text-xs font-mono text-primary truncate max-w-[150px]">
                        {displayAddress}
                      </span>
                      {currentAddress && (
                        <button 
                          onClick={handleCopyWallet}
                          className="p-1 hover:bg-surface rounded-md transition-colors text-primary"
                        >
                          {isCopied ? <Check size={14} className="text-accent" /> : <Copy size={14} />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="h-px bg-surface w-full" />

                  <button 
                    onClick={toggleLanguage}
                    className="flex justify-between items-center w-full p-2 hover:bg-village rounded-md transition-colors text-primary text-sm font-bold"
                  >
                    <span className="flex items-center gap-2">
                      <Globe size={16} />
                      {t('language')}
                    </span>
                    <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full">
                      {language === 'en' ? 'English' : '日本語'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
