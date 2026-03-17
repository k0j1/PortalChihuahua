import React, { useRef } from 'react';
import gsap from 'gsap';

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
  const buttonRef = useRef<HTMLButtonElement>(null);
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

  const handleMouseEnter = () => {
    if (!props.disabled && buttonRef.current) {
      gsap.to(buttonRef.current, { scale: 1.02, duration: 0.2, ease: 'power2.out' });
    }
  };

  const handleMouseLeave = () => {
    if (buttonRef.current) {
      gsap.to(buttonRef.current, { scale: 1, duration: 0.2, ease: 'power2.out' });
    }
  };

  const handleMouseDown = () => {
    if (!props.disabled && buttonRef.current) {
      gsap.to(buttonRef.current, { scale: 0.98, duration: 0.1, ease: 'power2.out' });
    }
  };

  const handleMouseUp = () => {
    if (!props.disabled && buttonRef.current) {
      gsap.to(buttonRef.current, { scale: 1.02, duration: 0.1, ease: 'power2.out' });
    }
  };

  return (
    <button
      ref={buttonRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
