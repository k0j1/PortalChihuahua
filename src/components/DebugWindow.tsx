import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { X, Trash2, Terminal } from 'lucide-react';

interface DebugWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DebugWindow: React.FC<DebugWindowProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setTimeout(() => {
        if (windowRef.current) {
          gsap.fromTo(windowRef.current, 
            { opacity: 0, y: 100 }, 
            { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
          );
        }
      }, 0);
    } else {
      if (windowRef.current) {
        gsap.to(windowRef.current, {
          opacity: 0,
          y: 100,
          duration: 0.3,
          ease: 'power2.in',
          onComplete: () => setShouldRender(false)
        });
      } else {
        setShouldRender(false);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const addLog = (type: string, ...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      const timestamp = new Date().toLocaleTimeString();
      setLogs(prev => [...prev, `[${timestamp}] [${type}] ${message}`].slice(-100));
    };

    console.log = (...args) => {
      originalLog.apply(console, args);
      addLog('LOG', ...args);
    };

    console.error = (...args) => {
      originalError.apply(console, args);
      addLog('ERROR', ...args);
    };

    console.warn = (...args) => {
      originalWarn.apply(console, args);
      addLog('WARN', ...args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <>
      {shouldRender && (
        <div
          ref={windowRef}
          className="fixed inset-0 z-[100] flex flex-col bg-village/95 backdrop-blur-md"
        >
          <div className="flex items-center justify-between p-4 border-b border-surface/30">
            <div className="flex items-center gap-2">
              <Terminal size={20} className="text-secondary" />
              <h3 className="font-black text-primary uppercase tracking-wider">Debug Console</h3>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setLogs([])}
                className="p-2 rounded-full hover:bg-surface transition-colors text-light"
              >
                <Trash2 size={20} />
              </button>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-surface transition-colors text-light"
              >
                <X size={24} />
              </button>
            </div>
          </div>
          
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-2"
          >
            {logs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-light italic">
                No logs captured yet...
              </div>
            ) : (
              logs.map((log, i) => (
                <div 
                  key={i} 
                  className={`pb-2 border-b border-surface/10 whitespace-pre-wrap break-all ${
                    log.includes('[ERROR]') ? 'text-red-400' : 
                    log.includes('[WARN]') ? 'text-yellow-400' : 
                    'text-body'
                  }`}
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
};
