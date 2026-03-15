import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-surface rounded-v-lg shadow-v-md p-v-md border border-surface ${className}`}>
      {children}
    </div>
  );
};
