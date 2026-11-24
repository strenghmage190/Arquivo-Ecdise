import React from 'react';
import styles from './Button.module.scss';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'solid' | 'caseDelete' | 'close';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Button({
  variant = 'secondary',
  size = 'md',
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = Boolean(disabled || loading);

  const variantClass =
    {
      primary: styles.primary,
      secondary: styles.secondary,
      ghost: styles.ghost,
      solid: styles.solid,
      caseDelete: styles.caseDelete,
      close: styles.close,
    }[variant] || styles.secondary;

  const sizeClass =
    {
      sm: styles.sizeSm,
      md: styles.sizeMd,
      lg: styles.sizeLg,
    }[size] || styles.sizeMd;

  const cls = [
    styles.button,
    variantClass,
    sizeClass,
    fullWidth ? styles.fullWidth : '',
    isDisabled ? styles.disabled : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={cls}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...rest}
    >
      {leftIcon && <span className={styles.icon}>{leftIcon}</span>}
      {children}
      {rightIcon && <span className={styles.icon}>{rightIcon}</span>}
    </button>
  );
}
