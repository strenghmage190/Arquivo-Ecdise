import React from 'react';
import styles from './Button.module.scss';

type Variant = 'primary' | 'secondary' | 'ghost' | 'solid' | 'caseDelete' | 'close';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export default function Button({ variant = 'secondary', className = '', children, ...rest }: Props) {
  const variantClass = {
    primary: styles.primary,
    secondary: styles.secondary,
    ghost: styles.ghost,
    solid: styles.solid,
    caseDelete: styles.caseDelete,
    close: styles.close,
  }[variant] || styles.secondary;

  const cls = `${styles.button} ${variantClass} ${rest.disabled ? styles.disabled : ''} ${className}`.trim();

  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
