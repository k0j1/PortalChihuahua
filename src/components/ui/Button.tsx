import React from 'react';
import { motion } from 'motion/react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-village-primary disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary text-inverse hover:bg-opacity-90 shadow-v-sm',
    secondary: 'bg-secondary text-inverse hover:bg-opacity-90 shadow-v-sm',
    accent: 'bg-accent text-inverse hover:bg-opacity-90 shadow-v-sm',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-inverse',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-v-sm',
    md: 'px-4 py-2 text-base rounded-v-md',
    lg: 'px-6 py-3 text-lg rounded-v-lg',
  };

  return (
    <motion.button
      whileHover={{ scale: props.disabled ? 1 : 1.02 }}
      whileTap={{ scale: props.disabled ? 1 : 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};
