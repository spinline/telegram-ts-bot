/**
 * ShieldAnimation Component
 * Reusable shield animation with ripple effect
 */

import { ThemeIcon } from '@mantine/core';
import { IconShield } from '@tabler/icons-react';

interface ShieldAnimationProps {
  size?: number;
  color?: string;
}

export function ShieldAnimation({ size = 100, color = 'teal' }: ShieldAnimationProps) {
  return (
    <div
      className="shield-ripple"
      style={{
        position: 'absolute',
        top: -40,
        zIndex: 3,
        ['--signal-color' as any]: 'rgba(20, 184, 166, 0.55)',
      }}
    >
      <div className="ripple ripple-1" />
      <div className="ripple ripple-2" />
      <div className="ripple ripple-3" />
      <ThemeIcon variant="filled" size={size} radius="xl" color={color} className="shield-core">
        <IconShield style={{ width: '70%', height: '70%' }} stroke={1.6} />
      </ThemeIcon>
    </div>
  );
}

