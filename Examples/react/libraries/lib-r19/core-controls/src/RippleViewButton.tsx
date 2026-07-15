import { Button } from 'primereact/button';

export interface RippleViewButtonProps {
  label: string;
  icon?: string;
  disabled?: boolean;
  /**
   * 19.1.0: purely additive — default 'primary' renders identically to
   * 19.0.0 (no extra style class), so existing consumers see zero visual
   * change. A true compatible upgrade, not just a version bump.
   */
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
}

export function RippleViewButton({ label, icon, disabled = false, variant = 'primary', onClick }: RippleViewButtonProps) {
  const handleClick = () => {
    onClick?.();
  };

  return (
    <Button
      label={label}
      icon={icon}
      disabled={disabled}
      severity={variant === 'secondary' ? 'secondary' : undefined}
      onClick={handleClick}
    />
  );
}
