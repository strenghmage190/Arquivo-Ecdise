import React from 'react';
import styles from './Button.module.scss';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'solid' | 'caseDelete' | 'close';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export default function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const variantClass = {
    primary: styles.primary,
    secondary: styles.secondary,
    ghost: styles.ghost,
    solid: styles.solid,
    caseDelete: styles.caseDelete,
    close: styles.close,
  }[variant] || styles.secondary;

  const sizeClass = {
    sm: styles.sizeSm,
    md: styles.sizeMd,
    lg: styles.sizeLg,
  }[size] || styles.sizeMd;

  const cls = `${styles.button} ${variantClass} ${sizeClass} ${rest.disabled ? styles.disabled : ''} ${className}`.trim();

  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
