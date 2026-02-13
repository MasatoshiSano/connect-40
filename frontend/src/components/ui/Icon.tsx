import type { ComponentProps } from 'react';

interface IconProps extends ComponentProps<'span'> {
  name: string;
  filled?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'text-base',    // 16px
  md: 'text-xl',      // 20px
  lg: 'text-2xl',     // 24px
  xl: 'text-3xl',     // 30px
};

export const Icon = ({
  name,
  filled = false,
  size = 'md',
  className = '',
  ...props
}: IconProps) => {
  const baseClass = filled ? 'material-symbols-filled' : 'material-symbols-outlined';
  const sizeClass = sizeClasses[size];

  return (
    <span
      className={`${baseClass} ${sizeClass} ${className}`}
      {...props}
    >
      {name}
    </span>
  );
};
