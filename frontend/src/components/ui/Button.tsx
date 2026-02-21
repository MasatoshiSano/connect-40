import { type ButtonHTMLAttributes, type ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-transparent border border-gold text-gold hover:bg-gold/10 active:bg-gold/20',
  secondary: 'text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary underline underline-offset-4',
  outline: 'border border-border-light dark:border-border-dark text-text-primary dark:text-text-dark-primary hover:border-gold/40',
  ghost: 'text-text-secondary dark:text-text-dark-secondary hover:text-gold',
  danger: 'text-warm hover:text-warm/80',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl',
};

export const Button = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        font-light tracking-ryokan transition-all duration-base ease-elegant
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
