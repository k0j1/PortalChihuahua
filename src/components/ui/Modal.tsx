import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // ESCキーで閉じる処理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setTimeout(() => {
        if (overlayRef.current && contentRef.current) {
          gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
          gsap.fromTo(contentRef.current, 
            { scale: 0.9, opacity: 0, y: 20 }, 
            { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'back.out(1.7)' }
          );
        }
      }, 0);
    } else {
      if (overlayRef.current && contentRef.current) {
        const tl = gsap.timeline({ onComplete: () => setShouldRender(false) });
        tl.to(contentRef.current, { scale: 0.9, opacity: 0, y: 20, duration: 0.3, ease: 'power2.in' })
          .to(overlayRef.current, { opacity: 0, duration: 0.2 }, "-=0.2");
      } else {
        setShouldRender(false);
      }
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-v-md">
      <div
        ref={overlayRef}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <div
        ref={contentRef}
        className="relative w-full max-w-md bg-surface rounded-v-lg shadow-v-lg overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-v-md border-b border-surface bg-village">
          <h2 className="text-lg font-bold text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-v-full hover:bg-black/5 text-light transition-colors"
            aria-label="閉じる"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-v-md overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
